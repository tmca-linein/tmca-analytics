"use server"
import { cacheAncestorMappings, cacheUsernames, getAllParents, getUserName } from "@/cache/user-cache";
import { SpaceItem, WrikeApiFolderResponse, WrikeApiTasksResponse, WrikeFolder } from "@/types/wrikeItem";
import { axiosRequest } from "../lib/axios";
import { chunkArray } from "../lib/utils";
import { getFoldersForSession } from "@/cache/wrikeItem-cache";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { getFolderTaskIds } from "@/cache/folderTaskChildren-cache";
import { getSpaceItemMetrics } from "@/cache/spaceItemMetrics-cache";

async function buildSpaceItemWarnings(parentItem: SpaceItem | undefined, childItemSharedIds: string[]) {
    if (!parentItem) return '';
    const warnings: string[] = [];
    const parentSharedSet = new Set(parentItem.sharedIds);
    if (!childItemSharedIds) return "";
    for (const sid of childItemSharedIds ?? []) {
        if (parentSharedSet.has(sid)) continue;
        const parents = getAllParents(sid) ?? [];
        let covered = false;
        for (const pid of parents) {
            if (parentSharedSet.has(pid)) { covered = true; break; }
        }

        if (!covered) {
            warnings.push(`${await getUserName(sid)} was explictly shared on a task level but not on a folder level!`);
        }
    }

    const warning = warnings.join("; ");
    return warning;
}

async function buildTaskSpaceItems(taskIds: string[], taskParentMap: Map<string, SpaceItem | undefined>): Promise<SpaceItem[]> {
    const taskChunks = chunkArray(taskIds, 100);
    const allTaskResponses = await Promise.all(
        taskChunks.map((chunk) =>
            axiosRequest<WrikeApiTasksResponse>('GET', `/tasks/${chunk.join(',')}`)
        )
    );
    const taskDetails = allTaskResponses.flatMap(t => t.data.data);
    return Promise.all(
        taskDetails.map(async task => {
            const parentItem = taskParentMap.get(task.id);
            const warning = await buildSpaceItemWarnings(parentItem, task.sharedIds);
            const itemMetrics = await getSpaceItemMetrics(task.id);
            const spaceItem = {
                id: task.id,
                itemName: task.title,
                itemType: "Task" as const,
                author: task.authorIds?.[0] ? await getUserName(task.authorIds[0]) || "" : "",
                folderChildIds: [],
                taskChildIds: task.subTaskIds || [],
                subRows: [],
                warning,
                sharedIds: task.sharedIds,
                sharedWith: task.sharedIds?.length
                    ? (await Promise.all(task.sharedIds
                        .filter(sid => sid !== process.env.MAIN_UID)
                        .map(getUserName))).filter(Boolean).join(", ")
                    : "",
                permalink: task.permalink,
                anfAddedDay: itemMetrics?.anfAddedDay ?? 0,
                anfAddedWeek: itemMetrics?.anfAddedWeek ?? 0,
                anfAddedMonth: itemMetrics?.anfAddedMonth ?? 0,
                anfAddedLastMonth: itemMetrics?.anfAddedLastMonth ?? 0,
                anfRemovedDay: itemMetrics?.anfRemovedDay ?? 0,
                anfRemovedWeek: itemMetrics?.anfRemovedWeek ?? 0,
                anfRemovedMonth: itemMetrics?.anfRemovedMonth ?? 0,
                anfRemovedLastMonth: itemMetrics?.anfRemovedLastMonth ?? 0,
                avgDurationWeek: itemMetrics?.avgDurationWeek ?? 0,
                topFiveAvgDurationWeek: itemMetrics?.topFiveAvgDurationWeek ?? 0,
                transitionsCountWeek: itemMetrics?.transitionsCountWeek ?? 0,
                overdueCountWeek: itemMetrics?.overdueCountWeek ?? 0,
                avgOverdueHoursWeek: itemMetrics?.avgOverdueHoursWeek ?? 0,
                avgDurationMonth: itemMetrics?.avgDurationMonth ?? 0,
                topFiveAvgDurationMonth: itemMetrics?.topFiveAvgDurationMonth ?? 0,
                transitionsCountMonth: itemMetrics?.transitionsCountMonth ?? 0,
                overdueCountMonth: itemMetrics?.overdueCountMonth ?? 0,
                avgOverdueHoursMonth: itemMetrics?.avgOverdueHoursMonth ?? 0,
                avgDurationLastMonth: itemMetrics?.avgDurationLastMonth ?? 0,
                topFiveAvgDurationLastMonth: itemMetrics?.topFiveAvgDurationLastMonth ?? 0,
                transitionsCountLastMonth: itemMetrics?.transitionsCountLastMonth ?? 0,
                overdueCountLastMonth: itemMetrics?.overdueCountLastMonth ?? 0,
                avgOverdueHoursLastMonth: itemMetrics?.avgOverdueHoursLastMonth ?? 0,
                countDay: itemMetrics?.countDay ?? 0,
                countWeek: itemMetrics?.countWeek ?? 0,
                countMonth: itemMetrics?.countMonth ?? 0,
                countLastMonth: itemMetrics?.countLastMonth ?? 0,
                avgWordCountDay: itemMetrics?.avgWordCountDay ?? 0,
                avgWordCountWeek: itemMetrics?.avgWordCountWeek ?? 0,
                avgWordCountMonth: itemMetrics?.avgWordCountMonth ?? 0,
                avgWordCountLastMonth: itemMetrics?.avgWordCountLastMonth ?? 0
            }

            return spaceItem;
        })
    );
}

async function handleTasks(rootFolders: SpaceItem[]) {
    const entries = await Promise.all(
        rootFolders.map(async (f) => {
            const taskIds = await getFolderTaskIds(f.id);
            return [f.id, taskIds] as [string, string[]];
        })
    );

    const allTaskIds = entries.flatMap(([, ids]) => ids);
    const uniqueTaskIds = [...new Set(allTaskIds)];
    const taskParentMap = new Map<string, SpaceItem | undefined>();
    for (const [folderId, taskIds] of entries) {
        const folder = rootFolders.find(f => f.id === folderId);
        for (const tid of taskIds) {
            taskParentMap.set(tid, folder);
        }
    }

    return await buildTaskSpaceItems(uniqueTaskIds, taskParentMap);
}

async function buildFolderSpaceItems(
    folderIds: string[],
    spaceTypeItemIds: string[]): Promise<SpaceItem[]> {
    const folderChunks = chunkArray(folderIds, 100);
    const allFolderResponses = await Promise.all(
        folderChunks.map((chunk) =>
            axiosRequest<WrikeApiFolderResponse>('GET', `/folders/${chunk.join(',')}`)
        )
    );
    const folderDetails = allFolderResponses.flatMap(f => f.data.data);
    return Promise.all(
        folderDetails.map(async folder => {
            const itemMetrics = await getSpaceItemMetrics(folder.id);
            const itemType: SpaceItem['itemType'] =
                spaceTypeItemIds.includes(folder.id) ?
                    "Space" :
                    folder.project ?
                        "Project" :
                        "Folder";
            const taskChildren = await getFolderTaskIds(folder.id) ?? [];
            const spaceItem = ({
                id: folder.id,
                itemName: folder.title,
                itemType: itemType,
                author: folder.project?.authorId ? await getUserName(folder.project.authorId) || "" : "",
                folderChildIds: folder.childIds || [],
                taskChildIds: taskChildren,
                subRows: [],
                warning: "",
                sharedIds: folder.sharedIds,
                sharedWith: folder.sharedIds?.length
                    ? (await Promise.all(folder.sharedIds
                        .filter(sid => sid !== process.env.MAIN_UID)
                        .map(getUserName))).filter(Boolean).join(", ")
                    : "",
                permalink: folder.permalink,
                anfAddedDay: itemMetrics?.anfAddedDay ?? 0,
                anfAddedWeek: itemMetrics?.anfAddedWeek ?? 0,
                anfAddedMonth: itemMetrics?.anfAddedMonth ?? 0,
                anfAddedLastMonth: itemMetrics?.anfAddedLastMonth ?? 0,
                anfRemovedDay: itemMetrics?.anfRemovedDay ?? 0,
                anfRemovedWeek: itemMetrics?.anfRemovedWeek ?? 0,
                anfRemovedMonth: itemMetrics?.anfRemovedMonth ?? 0,
                anfRemovedLastMonth: itemMetrics?.anfRemovedLastMonth ?? 0,
                avgDurationWeek: itemMetrics?.avgDurationWeek ?? 0,
                topFiveAvgDurationWeek: itemMetrics?.topFiveAvgDurationWeek ?? 0,
                transitionsCountWeek: itemMetrics?.transitionsCountWeek ?? 0,
                overdueCountWeek: itemMetrics?.overdueCountWeek ?? 0,
                avgOverdueHoursWeek: itemMetrics?.avgOverdueHoursWeek ?? 0,
                avgDurationMonth: itemMetrics?.avgDurationMonth ?? 0,
                topFiveAvgDurationMonth: itemMetrics?.topFiveAvgDurationMonth ?? 0,
                transitionsCountMonth: itemMetrics?.transitionsCountMonth ?? 0,
                overdueCountMonth: itemMetrics?.overdueCountMonth ?? 0,
                avgOverdueHoursMonth: itemMetrics?.avgOverdueHoursMonth ?? 0,
                avgDurationLastMonth: itemMetrics?.avgDurationLastMonth ?? 0,
                topFiveAvgDurationLastMonth: itemMetrics?.topFiveAvgDurationLastMonth ?? 0,
                transitionsCountLastMonth: itemMetrics?.transitionsCountLastMonth ?? 0,
                overdueCountLastMonth: itemMetrics?.overdueCountLastMonth ?? 0,
                avgOverdueHoursLastMonth: itemMetrics?.avgOverdueHoursLastMonth ?? 0,
                countDay: itemMetrics?.countDay ?? 0,
                countWeek: itemMetrics?.countWeek ?? 0,
                countMonth: itemMetrics?.countMonth ?? 0,
                countLastMonth: itemMetrics?.countLastMonth ?? 0,
                avgWordCountDay: itemMetrics?.avgWordCountDay ?? 0,
                avgWordCountWeek: itemMetrics?.avgWordCountWeek ?? 0,
                avgWordCountMonth: itemMetrics?.avgWordCountMonth ?? 0,
                avgWordCountLastMonth: itemMetrics?.avgWordCountLastMonth ?? 0
            });

            return spaceItem;
        })
    );
}

async function handleFolders(folders: WrikeFolder[],
    rootIsSpace: boolean): Promise<{
        folderSpaceItems: SpaceItem[],
        rootFolderIds: string[],
    }> {
    const filteredFolders = folders.filter(
        folder => folder.title !== 'Personal'
    );
    const byId = new Map<string, WrikeFolder>();
    for (const f of filteredFolders) byId.set(f.id, f);

    const rootFolder = filteredFolders.find((f) => f.title === "Root");
    if (!rootFolder?.childIds?.length) return { folderSpaceItems: [], rootFolderIds: [] };

    const rootSpaceItems = rootFolder.childIds
        .map((childId) => byId.get(childId))
        .filter((f): f is WrikeFolder => !!f && f.space === rootIsSpace);
    const rootFolderIds = rootSpaceItems.map(f => f.id);
    const spaceTypeItemIds = rootIsSpace ? rootFolderIds.map(si => si) : [];
    const childItds = rootSpaceItems.flatMap(item => item.childIds);
    const foldersToFetch = [...rootFolderIds, ...childItds];
    const folderSpaceItems = await buildFolderSpaceItems(foldersToFetch, spaceTypeItemIds);
    return { folderSpaceItems, rootFolderIds };
}

export async function fetchSpaceItems(rootIsSpace: boolean): Promise<{
    allSpaceItems: SpaceItem[],
    rootFolderIds: string[]
}> {
    await cacheUsernames();
    await cacheAncestorMappings();
    const session = await getServerSession(authConfig);
    if (!session?.user.id) return { allSpaceItems: [], rootFolderIds: [] };
    const userId = session.user.id;
    const folders = await getFoldersForSession(userId);
    const { folderSpaceItems, rootFolderIds } = await handleFolders(folders, rootIsSpace);
    const rootItems = folderSpaceItems.filter(e => rootFolderIds.includes(e.id));
    const taskSpaceItems = await handleTasks(rootItems);
    const allSpaceItems = [...taskSpaceItems, ...folderSpaceItems];
    return { allSpaceItems, rootFolderIds }
};

export async function loadSecondLvlItemChildren(secondLvlItems: SpaceItem[]) {
    const folderTypeChildren = secondLvlItems.flatMap(sr => sr.folderChildIds);
    const taskTypeChildren = [];
    const taskParentMap = new Map<string, SpaceItem | undefined>();
    for (const item of secondLvlItems) {
        taskTypeChildren.push(...item.taskChildIds);
        for (const tid of item.taskChildIds) {
            taskParentMap.set(tid, item);
        }
    }
    const uniqueTaskIds = [...new Set(taskTypeChildren)];
    const result: SpaceItem[] = [];

    if (folderTypeChildren.length > 0) {
        // fetch n+3 level folders 
        result.push(...(await buildFolderSpaceItems(folderTypeChildren, [])));
    }

    if (taskTypeChildren.length > 0) {
        result.push(...(await buildTaskSpaceItems(uniqueTaskIds, taskParentMap)));
    }

    return result;
}