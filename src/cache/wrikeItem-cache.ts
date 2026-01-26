import { axiosRequest } from "@/lib/axios";
import { WrikeFolder, WrikeTask } from "@/types/wrikeItem";
import { LRUCache } from "lru-cache";

async function collectFoldersAndTasks(): Promise<{ tasks: WrikeTask[]; folders: WrikeFolder[] }> {
    const { data } = await axiosRequest<{ data: WrikeFolder[] }>("GET", '/folders?fields=["space"]');
    const folders = data.data;

    const tasks: WrikeTask[] = [];
    let nextPageToken: string | undefined = undefined;
    do {
        const param: string = nextPageToken ? `&nextPageToken=${nextPageToken}` : "";
        const res = await axiosRequest<{ data: WrikeTask[]; nextPageToken?: string }>(
            "GET",
            `/tasks?pageSize=1000${param}&fields=["parentIds", "subTaskIds", "authorIds", "customFields"]`
        );
        tasks.push(...(res.data.data ?? []));
        nextPageToken = res.data.nextPageToken;
    } while (nextPageToken);

    return { tasks, folders };
}

const DEFAULT_TTL_MS = 1000 * 60 * 60;
const MAX_ENTRIES = 1000;

const cache = new LRUCache({
    max: MAX_ENTRIES,
    ttl: DEFAULT_TTL_MS,
});

const inflight = new Map<string, Promise<{ tasks: WrikeTask[]; folders: WrikeFolder[] }>>();

function tasksKey(userId: string) {
    return `${userId}:Tasks`;
}

function foldersKey(userId: string) {
    return `${userId}:Folders`;
}

function combinedKey(userId: string) {
    return `${userId}:All`;
}

async function fetchAndPopulate(userId: string) {
    const cKey = combinedKey(userId);
    if (inflight.has(cKey)) return inflight.get(cKey)!;

    const p = (async () => {
        try {
            const { tasks, folders } = await collectFoldersAndTasks();
            cache.set(tasksKey(userId), tasks);
            cache.set(foldersKey(userId), folders);
            return { tasks, folders };
        } finally {

            inflight.delete(cKey);
        }
    })();

    inflight.set(cKey, p);
    return p;
}

export async function getTasksForSession(userId: string) {
    const k = tasksKey(userId);
    const cached = cache.get(k) as WrikeTask[] | undefined;

    if (cached) return cached;

    const result = await fetchAndPopulate(userId);
    return result.tasks;
}

export async function getFoldersForSession(userId: string) {
    const k = foldersKey(userId);
    const cached = cache.get(k) as WrikeFolder[] | undefined;
    if (cached) return cached;

    const result = await fetchAndPopulate(userId);
    return result.folders;
}

export function invalidateSessionCache(userId: string) {
    cache.delete(tasksKey(userId));
    cache.delete(foldersKey(userId));
    inflight.delete(combinedKey(userId));
}
