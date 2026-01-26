import { cacheAncestorMappings, cacheUsernames, getUserName } from "@/cache/user-cache";
import { SpaceItem, WrikeApiFolderResponse, WrikeFolder, WrikeTask } from "@/types/wrikeItem";
import { axiosRequest } from "../lib/axios";
import { chunkArray, sameMoment, startOfMonthUTC, startOfQuarterUTC, startOfWeekMondayUTC } from "../lib/utils";
import { getBulkFolderTasksTraversal } from "@/cache/folder-cache";
import { fetchBulkSpaceItemCommentActivity } from "@/stats/commentsRetriever";
import { fetchBulkSpaceItemANFActivity, fetchBulkSpaceItemANFDuration } from "@/stats/anfRetriever";
import { ANFDuration, BulkSpaceItemANFActivity, BulkSpaceItemCommentActivity, SpaceItemMetricData } from "@/types/stats";
import { getFoldersForSession, getTasksForSession } from "@/cache/wrikeItem-cache";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";

function addANFActivityMetrics(anfActivity: BulkSpaceItemANFActivity) {
    return ({
        anfAddedToday: anfActivity.addedToday,
        anfAddedThisWeek: anfActivity.addedWeek,
        anfAddedThisMonth: anfActivity.addedMonth,
        anfRemovedToday: anfActivity.removedToday,
        anfRemovedThisWeek: anfActivity.removedWeek,
        anfRemovedThisMonth: anfActivity.removedMonth
    })
}

function addLatestANFDurationMetrics(anfDuration: ANFDuration) {
    if (anfDuration.granularity === 'week') {
        if (!sameMoment(anfDuration.bucket.slice(0, 10), startOfWeekMondayUTC().toISOString().slice(0, 10))) return {}

        return ({
            anfDurationWeek: anfDuration.avgduration ?? 0,
            anfTopFiveDurationWeek: anfDuration.topfiveavgduration ?? 0,
            anfOverdueWeek: anfDuration.avgoverduehours ?? 0,
            anfOverdueCountsWeek: anfDuration.overdue_count,
            anfTransitionCountsWeek: anfDuration.transitions_count,
        })
    }

    if (anfDuration.granularity === 'month') {
        if (!sameMoment(anfDuration.bucket, startOfMonthUTC().toISOString())) return {}

        return ({
            anfDurationMonth: anfDuration.avgduration ?? 0,
            anfTopFiveDurationMonth: anfDuration.topfiveavgduration ?? 0,
            anfOverdueMonth: anfDuration.avgoverduehours ?? 0,
            anfOverdueCountsMonth: anfDuration.overdue_count,
            anfTransitionCountsMonth: anfDuration.transitions_count,
        })
    }

    if (anfDuration.granularity === 'quarter') {
        if (!sameMoment(anfDuration.bucket, startOfQuarterUTC().toISOString())) return {}

        return ({
            anfDurationQuarter: anfDuration.avgduration ?? 0,
            anfTopFiveDurationQuarter: anfDuration.topfiveavgduration ?? 0,
            anfOverdueQuarter: anfDuration.avgoverduehours ?? 0,
            anfOverdueCountsQuarter: anfDuration.overdue_count,
            anfTransitionCountsQuarter: anfDuration.transitions_count,
        })
    }
}

function addCommentActivityMetrics(commentActivity: BulkSpaceItemCommentActivity) {
    return ({
        commentsToday: commentActivity.countToday,
        commentsThisWeek: commentActivity.countWeek,
        commentsThisMonth: commentActivity.countMonth,
        commentAvgWordCountToday: Math.round(commentActivity.avgWordCountToday ?? 0),
        commentAvgWordCountThisWeek: Math.round(commentActivity.avgWordCountWeek ?? 0),
        commentAvgWordCountThisMonth: Math.round(commentActivity.avgWordCountMonth ?? 0)
    })
}

function buildTaskMappings(tasks: WrikeTask[]) {
    const parentToTaskIds = new Map<string, string[]>();

    for (const t of tasks) {
        for (const pid of t.parentIds ?? []) {
            const arr = parentToTaskIds.get(pid);
            if (arr) arr.push(t.id);
            else parentToTaskIds.set(pid, [t.id]);
        }
    }

    return parentToTaskIds;
}

function appendMetrics(spaceItem: SpaceItem, metrics: SpaceItemMetricData[]) {
    return metrics.reduce((item, metric) => {
        switch (metric.kind) {
            case "ANF_ACTIVITY":
                return { ...item, ...addANFActivityMetrics(metric.data) };
            case "ANF_DURATION":
                return { ...item, ...addLatestANFDurationMetrics(metric.data) };
            case "COMMENT_ACTIVITY":
                return { ...item, ...addCommentActivityMetrics(metric.data) };
        }
    }, spaceItem);
}

async function buildTaskSpaceItems(tasks: WrikeTask[], metricMap: Map<string, SpaceItemMetricData[]>): Promise<SpaceItem[]> {
    return Promise.all(
        tasks.map(async task => {
            const spaceItem = {
                id: task.id,
                itemName: task.title,
                itemType: "Task" as const,
                author: task.authorIds?.[0] ? await getUserName(task.authorIds[0]) || "" : "",
                folderChildIds: [],
                taskChildIds: task.subTaskIds || [],
                subRows: [],
                warning: "",
                sharedIds: task.sharedIds,
                sharedWith: task.sharedIds?.length
                    ? (await Promise.all(task.sharedIds
                        .filter(sid => sid !== process.env.MAIN_UID)
                        .map(getUserName))).filter(Boolean).join(", ")
                    : "",
                permalink: task.permalink,
            }

            return appendMetrics(spaceItem, metricMap.get(task.id) ?? []);
        })
    );
}

async function handleTasks(tasks: WrikeTask[], metricMap: Map<string, SpaceItemMetricData[]>) {
    const taskMappings = buildTaskMappings(tasks);
    const taskSpaceItems = await buildTaskSpaceItems(tasks, metricMap);
    return { taskSpaceItems, taskMappings };
}

function collectFolderDescendantIds(rootIds: string[], folderMap: Map<string, WrikeFolder>) {
    const visited = new Set<string>();
    const stack = [...rootIds]
    while (stack.length) {
        const id = stack.pop()!;
        if (visited.has(id)) continue;

        visited.add(id);
        const folder = folderMap.get(id);
        if (!folder) continue;

        for (const childId of folder.childIds ?? []) {
            if (!visited.has(childId)) stack.push(childId);
        }
    }

    return [...visited];
}

async function buildFolderSpaceItems(
    folderIds: string[],
    spaceTypeItemIds: string[],
    taskMappings: Map<string, string[]>,
    metricMap: Map<string, SpaceItemMetricData[]>): Promise<SpaceItem[]> {
    const folderChunks = chunkArray(folderIds, 100);
    const allFolderResponses = await Promise.all(
        folderChunks.map((chunk) =>
            axiosRequest<WrikeApiFolderResponse>('GET', `/folders/${chunk.join(',')}`)
        )
    );
    const folderDetails = allFolderResponses.flatMap(f => f.data.data);
    return Promise.all(
        folderDetails.map(async folder => {
            const itemType: SpaceItem['itemType'] =
                spaceTypeItemIds.includes(folder.id) ?
                    "Space" :
                    folder.project ?
                        "Project" :
                        "Folder"
            let spaceItem = ({
                id: folder.id,
                itemName: folder.title,
                itemType: itemType,
                author: folder.project?.authorId ? await getUserName(folder.project.authorId) || "" : "",
                folderChildIds: folder.childIds || [],
                taskChildIds: taskMappings.get(folder.id) ?? [],
                subRows: [],
                warning: "",
                sharedIds: folder.sharedIds,
                sharedWith: folder.sharedIds?.length
                    ? (await Promise.all(folder.sharedIds
                        .filter(sid => sid !== process.env.MAIN_UID)
                        .map(getUserName))).filter(Boolean).join(", ")
                    : "",
                permalink: folder.permalink
            })
            const taskMetrics = metricMap.get(folder.id) ?? [];

            for (const metric of taskMetrics) {
                switch (metric.kind) {
                    case "ANF_ACTIVITY":
                        spaceItem = { ...spaceItem, ...addANFActivityMetrics(metric.data as BulkSpaceItemANFActivity) };
                        break;
                    case "ANF_DURATION":
                        spaceItem = { ...spaceItem, ...addLatestANFDurationMetrics(metric.data as ANFDuration) };
                        break;
                    case "COMMENT_ACTIVITY":
                        spaceItem = { ...spaceItem, ...addCommentActivityMetrics(metric.data as BulkSpaceItemCommentActivity) };
                        break;
                }
            }

            return spaceItem
        })
    );
}

async function handleFolders(folders: WrikeFolder[],
    rootIsSpace: boolean,
    taskMappings: Map<string, string[]>,
    metricMap: Map<string, SpaceItemMetricData[]>): Promise<{
        folderSpaceItems: SpaceItem[],
        rootFolderIds: string[],
    }> {
    const byId = new Map<string, WrikeFolder>();
    for (const f of folders) byId.set(f.id, f);

    const rootFolder = folders.find((f) => f.title === "Root");
    if (!rootFolder?.childIds?.length) return { folderSpaceItems: [], rootFolderIds: [] };

    const rootSpaceItems = rootFolder.childIds
        .map((childId) => byId.get(childId))
        .filter((f): f is WrikeFolder => !!f && f.space === rootIsSpace);
    const spaceTypeItemIds = rootIsSpace ? rootSpaceItems.map(si => si.id) : [];
    const rootFolderIds = rootSpaceItems.map(f => f.id);
    const folderDescendantIds = collectFolderDescendantIds(rootFolderIds, byId);
    const foldersToFetch = [...rootFolderIds, ...folderDescendantIds];
    const folderSpaceItems = await buildFolderSpaceItems(foldersToFetch, spaceTypeItemIds, taskMappings, metricMap);
    return { folderSpaceItems, rootFolderIds };
}

function buildItemMetricMap(anfActivity: BulkSpaceItemANFActivity[], anfDuration: ANFDuration[], commentActivity: BulkSpaceItemCommentActivity[]) {
    const metricMap = new Map<string, SpaceItemMetricData[]>();
    const push = (rootId: string, metric: SpaceItemMetricData) => {
        const arr = metricMap.get(rootId);
        if (arr) arr.push(metric);
        else metricMap.set(rootId, [metric]);
    };

    for (const a of anfActivity) push(a.root_id, { data: { ...a }, kind: "ANF_ACTIVITY" });
    for (const d of anfDuration) push(d.root_id, { data: { ...d }, kind: "ANF_DURATION" });
    for (const c of commentActivity) push(c.root_id, { data: { ...c }, kind: "COMMENT_ACTIVITY" });

    return metricMap;
}

export async function fetchSpaceItems(rootIsSpace: boolean): Promise<{
    allSpaceItems: SpaceItem[],
    rootFolderIds: string[]
}> {
    const start = Date.now();
    console.log('starting to load data')
    await cacheUsernames();
    await cacheAncestorMappings();
    console.log('users retrieved')
    console.log('Duration', Date.now() - start)
    const session = await getServerSession(authConfig);
    if (!session?.user.id) return { allSpaceItems: [], rootFolderIds: [] };
    const userId = session.user.id;
    const [tasks, folders] = await Promise.all([
        getTasksForSession(userId),
        getFoldersForSession(userId)
    ]);

    console.log('fetched tasks and folders')
    console.log('Duration', Date.now() - start)
    const folderDescendantMap = getBulkFolderTasksTraversal(folders, tasks);
    console.log('folder task traversal')
    console.log('Duration', Date.now() - start)

    const [anfActivity, anfDuration, commentActivity] = await Promise.all([
        fetchBulkSpaceItemANFActivity(folderDescendantMap),
        fetchBulkSpaceItemANFDuration(folderDescendantMap),
        fetchBulkSpaceItemCommentActivity(folderDescendantMap)
    ]);
    console.log("Fetched from DB")
    console.log('Duration', Date.now() - start)

    const metricMap = buildItemMetricMap(anfActivity, anfDuration, commentActivity);
    console.log("metric map built")
    console.log('Duration', Date.now() - start)

    // build task space items first & collect hierarchy mappings
    const { taskSpaceItems, taskMappings } = await handleTasks(tasks, metricMap);
    console.log('task space items done')
    console.log('Duration', Date.now() - start)

    // build folder space items & set hierarchy mappings in place
    const { folderSpaceItems, rootFolderIds } = await handleFolders(folders, rootIsSpace, taskMappings, metricMap);
    console.log('folder space items done')
    console.log('Duration', Date.now() - start)
    const allSpaceItems = [...taskSpaceItems, ...folderSpaceItems];
    console.log('items built')
    return { allSpaceItems, rootFolderIds }
};