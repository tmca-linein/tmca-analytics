"use server"
import { unstable_cache } from "next/cache";
import { ApiWrikeUser, ApiWrikeUserGroup, WrikeApiContactsResponse, WrikeApiUserGroupResponse } from "@/types/user";
import { AxiosRequestConfig } from "axios";
import { axiosRequest, getHeaderConfig } from "@/lib/axios";
import prisma from "@/lib/db";

async function fetchUserGroups(config: AxiosRequestConfig | undefined): Promise<ApiWrikeUserGroup[]> {
    const res = await axiosRequest<WrikeApiUserGroupResponse>("GET", `/groups`, undefined, config);
    const ugData = res.data.data;
    return ugData;
}

const cachedFetchUserGroups = unstable_cache(
    (config: AxiosRequestConfig | undefined) => fetchUserGroups(config),
    [`wrike-ug`],
    { revalidate: 3600 }
);

export async function getCompanies(): Promise<string[]> {
    const config = await getHeaderConfig();
    const ugData = await cachedFetchUserGroups(config);
    const GROU = ugData.filter((ug: ApiWrikeUserGroup) => ug.title === 'GROU')[0];
    const companies = ugData
        .filter((ug: ApiWrikeUserGroup) => GROU.childIds.includes(ug.id))
        .map((ug: ApiWrikeUserGroup) => ug.title);
    return companies;
}

export async function getRoleOptions(): Promise<Map<string, string[]>> {
    const config = await getHeaderConfig();
    const ugData = await cachedFetchUserGroups(config);
    const GROU = ugData.filter((ug: ApiWrikeUserGroup) => ug.title === 'GROU')[0];
    const companies = ugData.filter((ug: ApiWrikeUserGroup) => GROU.childIds.includes(ug.id));
    const companyRoles = new Map<string, string[]>();
    for (const company of companies) {
        const roleIds = company.childIds;
        const roles = ugData.filter(ug => roleIds.includes(ug.id)).map(ug => ug.title);
        companyRoles.set(company.title, roles);
    }

    return companyRoles;
}

function chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
}

const getAllChildGroupIds = (
    allGroups: ApiWrikeUserGroup[],
    rootId: string
): string[] => {
    const groupMap = new Map(allGroups.map(g => [g.id, g]));

    const result: string[] = [];
    const stack = [...(groupMap.get(rootId)?.childIds ?? [])];
    const visited = new Set<string>();

    while (stack.length) {
        const id = stack.pop()!;
        if (visited.has(id)) continue;
        visited.add(id);

        result.push(id);

        const group = groupMap.get(id);
        if (group?.childIds?.length) {
            stack.push(...group.childIds);
        }
    }

    return result;
};

async function retrieveUserData(memberIds: string[]) {
    const userChunks = chunkArray(memberIds, 100);
    const userResponses = await Promise.all(
        userChunks.map((chunk) =>
            axiosRequest<WrikeApiContactsResponse>(
                "GET",
                `/contacts/${chunk.join(",")}`
            )
        )
    );

    const users = userResponses.flatMap((res) => res.data.data);
    return users;
}

async function fetchUsersFromUGTree(userGroups: ApiWrikeUserGroup[], parentGroupId: string): Promise<ApiWrikeUser[]> {
    const parentGroupChildren = [parentGroupId, ...getAllChildGroupIds(userGroups, parentGroupId)];
    const memberIds = [...new Set(
        userGroups
            .filter(g => parentGroupChildren.includes(g.id))
            .flatMap(g => g.memberIds ?? [])
    )];
    if (memberIds.length === 0) return [];

    return await retrieveUserData(memberIds);
}

async function getCEOSubordinates(userId: string, userGroups: ApiWrikeUserGroup[]): Promise<ApiWrikeUser[]> {
    const ceoUserGroups = userGroups.filter(ug => ug.title.endsWith("CEO"))
    const ceoOf = ceoUserGroups.filter(ug => ug.memberIds.includes(userId))
    if (!ceoOf || ceoOf.length === 0) return [];
    const subordinates = [];
    for (const ceoGroup of ceoOf) {
        const companyParentGroup = ceoGroup.parentIds[0];
        const users = await fetchUsersFromUGTree(userGroups, companyParentGroup);
        subordinates.push(...users);
    }

    return subordinates;
}

async function getCustomSubordinates(userId: string, userGroups: ApiWrikeUserGroup[]) {
    const rbac = await prisma.rBAC.findMany();
    const subordinates = []
    for (const rbac_rule of rbac) {
        const role_title = rbac_rule.role;
        const role = userGroups.filter(ug => ug.title === role_title && ug.memberIds.includes(userId));
        if (!role || role.length == 0) continue; // user does not belong to the custom rule -> continue

        const accessibleGroups = userGroups.filter(ug => rbac_rule.accessTo.some(tag => ug.title.startsWith(tag)));
        for (const ag of accessibleGroups) {
            const groupSubordinates = await fetchUsersFromUGTree(userGroups, ag.id)
            subordinates.push(...groupSubordinates);
        }
    }

    return subordinates;
}


export async function getSubordinates(userId: string) {
    const config = await getHeaderConfig();
    const userGroups = await cachedFetchUserGroups(config);
    const ceoUsers = await getCEOSubordinates(userId, userGroups);
    const customAccessibleUsers = await getCustomSubordinates(userId, userGroups);
    return Array.from(
        new Map(
            [...ceoUsers, ...customAccessibleUsers].map(u => [u.id, u])
        ).values()
    );
}