import { axiosRequest } from "@/lib/axios";
import { WrikeApiContactsResponse, WrikeApiFolderResponse, WrikeApiFolderTreeResponse, WrikeApiTasksResponse, WrikeFolder } from "../types/wrikeItem";
import prisma from "@/lib/db";
import pLimit from 'p-limit';

const limit = pLimit(10);
console.log('DBBuilder: Current runtime:', process.env.NEXT_RUNTIME); // 'edge' or 'nodejs'

async function getDBUsers(userIdList: string[]) {
    if (!userIdList.length) return [];

    return prisma.wrikeUser.findMany({
        where: {
            id: { in: userIdList },
            deleted: false,
        },
    });
}

async function mapUsersToItem(itemId: string, sharedIds: string[]) {
    if (!sharedIds.length) return;

    const sharedUsers = await getDBUsers(sharedIds);
    if (!sharedUsers.length) return;

    await prisma.wrikeUserItems.createMany({
        data: sharedUsers.map((u) => ({
            userId: u.id,
            wrikeItemId: itemId,
        })),
        skipDuplicates: true,
    });
}

export const buildWrikeItemContext = async () => {

    const response = await axiosRequest<WrikeApiFolderTreeResponse>('GET', '/folders', null, process.env.WRIKE_SYNC_ACCESS_TOKEN)
    const data = response.data.data;

    const hierarchyMap = new Map<string, string[]>();
    await Promise.all(
        data.map((f, i) => limit(async () => {
            const itemDetails = await axiosRequest<WrikeApiFolderResponse>('GET', `/folders/${f.id}?fields=["space"]`, null, process.env.WRIKE_SYNC_ACCESS_TOKEN).catch(() => null);
            const item = itemDetails?.data.data[0] as WrikeFolder;
            if (!item) return null;

            const creationDate = new Date(item.createdDate);
            const updatedDate = new Date(item.updatedDate);
            const itemType = item.space ? "Space" : data[i].project ? "Project" : "Folder";
            let author = undefined;
            if (data[i].project) {
                author = data[i].project.authorId
            }

            // persist space, folder, project
            const wrikeItem = await prisma.wrikeItem.create({
                data: {
                    id: item.id,
                    title: item.title,
                    itemType: itemType,
                    warning: "",
                    authorId: author,
                    permalink: item.permalink,
                    createdAt: creationDate,
                    updatedAt: updatedDate,
                },
            });

            // link shared users
            await mapUsersToItem(wrikeItem.id, item.sharedIds);

            // get tasks for each wrike space, folder, project item
            const tasks = await axiosRequest<WrikeApiTasksResponse>('GET', `/folders/${item.id}/tasks?fields=["sharedIds", "authorIds"]`, null, process.env.WRIKE_SYNC_ACCESS_TOKEN)
            const wrikeItemTaskIds: string[] = []
            // persist tasks as WrikeItems
            await Promise.all(
                tasks.data.data.map(async (t, i) => {
                    if (!t) return null;
                    wrikeItemTaskIds.push(t.id);
                    const creationDate = new Date(t.createdDate);
                    const updatedDate = new Date(t.updatedDate);
                    const author = t.authorIds[0];
                    const wrikeTask = await prisma.wrikeItem.create({
                        data: {
                            id: t.id,
                            title: t.title,
                            itemType: "Task",
                            warning: "",
                            authorId: author,
                            permalink: t.permalink,
                            createdAt: creationDate,
                            updatedAt: updatedDate,
                        }
                    })
                    // link task users to tasks
                    await mapUsersToItem(wrikeTask.id, t.sharedIds)
                })
            )

            // save relations to be persisted later
            hierarchyMap.set(item.id, [...item.childIds, ...wrikeItemTaskIds]);
        }))
    );

    // link childids and link wrike items together.
    await prisma.wrikeItemParent.createMany({
        data: Array.from(hierarchyMap.entries()).flatMap(
            ([parentId, childIds]) =>
                childIds.map((childId) => ({ parentId, childId }))
        ),
        skipDuplicates: true,
    });
}

export async function buildWrikeUserContext() {
    const res = await axiosRequest<WrikeApiContactsResponse>('GET', `/contacts`, null, process.env.WRIKE_SYNC_ACCESS_TOKEN);
    const userData = res.data.data;
    await Promise.all(userData.map(async (user) => {
        const { profiles, locale, timezone, me, title, memberIds, companyName, myTeam, ...dbUser } = user;
        await prisma.wrikeUser.create({
            data: dbUser
        })
    }));
}