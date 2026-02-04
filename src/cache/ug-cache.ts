"use server"

import { ApiWrikeUser, ApiWrikeUserGroup, WrikeApiContactsResponse, WrikeApiUserGroupResponse } from "@/types/user";
import { axiosRequest } from "@/lib/axios";
import prisma from "@/lib/db";
import { chunkArray } from "../lib/utils";

const ugCacheById = new Map<string, ApiWrikeUserGroup>();
const ugCacheByTitle = new Map<string, ApiWrikeUserGroup>();
const TTL_MS = 60 * 60 * 1000;
let ugCacheExpires: number;
let ugFetchInFlight: Promise<void> | null = null;

async function cachedFetchUserGroups() {
    const now = Date.now();

    if (ugCacheExpires && ugCacheExpires > now)
        return;

    if (ugFetchInFlight) {
        await ugFetchInFlight;
        return;
    }

    ugFetchInFlight = (async () => {
        try {
            ugCacheById.clear();
            ugCacheByTitle.clear();
            const res = await axiosRequest<WrikeApiUserGroupResponse>("GET", `/groups`);
            const ugData = res.data.data;
            for (const ug of ugData) {
                ugCacheById.set(ug.id, ug);
                ugCacheByTitle.set(ug.title, ug);
            }

            ugCacheExpires = Date.now() + TTL_MS;
        } catch (error) {
            if (ugCacheById.size === 0) {
                throw error;
            }

            console.warn("Failed to refresh user groups - using stale cache:", error);
        } finally {
            ugFetchInFlight = null;
        }
    })();

    await ugFetchInFlight;
}

export async function getCompanies(): Promise<string[]> {
    await cachedFetchUserGroups();
    const GROU = ugCacheByTitle.get('GROU');
    if (!GROU) return [];
    return (GROU.childIds ?? []).map((c) => ugCacheById.get(c)?.title).filter(Boolean) as string[];
}

export async function getRoleOptions(): Promise<Map<string, string[]>> {
    await cachedFetchUserGroups();
    const GROU = ugCacheByTitle.get('GROU');
    if (!GROU) return new Map();

    const companies = (GROU.childIds ?? []).map((id) => ugCacheById.get(id)).filter(Boolean) as ApiWrikeUserGroup[];
    const companyRoles = new Map<string, string[]>();
    for (const company of companies) {
        const roleIds = company.childIds;
        // no need to go further down
        const subRoleIds = roleIds.flatMap(i => ugCacheById.get(i)?.childIds ?? []);
        const allRoleIds = [...roleIds, ...subRoleIds];
        const roles = allRoleIds.map((id) => ugCacheById.get(id)?.title).filter(Boolean) as string[];
        companyRoles.set(company.title, roles);
    }

    return companyRoles;
}

const getAllChildGroupIds = (
    rootId: string
): string[] => {

    const result: string[] = [];
    const stack = [...(ugCacheById.get(rootId)?.childIds ?? [])];
    const visited = new Set<string>();

    while (stack.length) {
        const id = stack.pop()!;
        if (visited.has(id)) continue;
        visited.add(id);

        result.push(id);

        const group = ugCacheById.get(id);
        if (group?.childIds?.length) {
            stack.push(...group.childIds);
        }
    }

    return result;
};

export async function retrieveUserData(memberIds: string[]) {
    if (!memberIds || memberIds.length === 0) return [];
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

async function fetchUsersFromUGTree(parentGroupId: string): Promise<ApiWrikeUser[]> {
    const parentGroupChildren = [parentGroupId, ...getAllChildGroupIds(parentGroupId)];
    const memberIds = [...new Set(
        parentGroupChildren.flatMap(i => ugCacheById.get(i)?.memberIds ?? [])
    )];
    if (memberIds.length === 0) return [];

    return await retrieveUserData(memberIds);
}

async function getCEOSubordinates(userId: string): Promise<ApiWrikeUser[]> {
    const allCEOUserGroups = Array.from(ugCacheByTitle.values()).filter((g) => g.title?.endsWith("CEO"));
    const ceoOf = allCEOUserGroups.filter(ug => !!ug && ug.memberIds.includes(userId));
    if (!ceoOf || ceoOf.length === 0) return [];
    const subordinates = [];
    for (const ceoGroup of ceoOf) {
        if (!ceoGroup) continue;
        const companyParentGroup = ceoGroup.parentIds[0];
        if (!companyParentGroup) continue;
        const users = await fetchUsersFromUGTree(companyParentGroup);
        subordinates.push(...users);
    }

    return subordinates;
}

async function getCustomSubordinates(userId: string) {
    const rbac = await prisma.rBAC.findMany();
    if (!rbac || rbac.length === 0) return [];

    const ugGroupTitles = Array.from(ugCacheByTitle.keys());
    const subordinates = []
    for (const rbac_rule of rbac) {
        const role_title = rbac_rule.role ?? "Unknown";
        const ug = ugCacheByTitle.get(role_title);
        const role = !!ug ? ug.memberIds.includes(userId) : undefined;
        if (!role) continue; // user does not belong to the custom rule -> continue

        const accessibleGroups = ugGroupTitles.filter(ug => rbac_rule.accessTo.some(tag => ug.startsWith(tag)));
        for (const title of accessibleGroups) {
            const ug = ugCacheByTitle.get(title);
            if (!ug) continue;
            const groupSubordinates = await fetchUsersFromUGTree(ug.id);
            subordinates.push(...groupSubordinates);
        }
    }

    return subordinates;
}

export async function getSubordinates(userId: string) {
    await cachedFetchUserGroups();
    const sessionUser = await retrieveUserData([userId]);
    const ceoUsers = await getCEOSubordinates(userId);
    const customAccessibleUsers = await getCustomSubordinates(userId);
    return Array.from(
        new Map(
            [...ceoUsers, ...customAccessibleUsers, ...sessionUser].map(u => [u.id, u])
        ).values()
    );
}