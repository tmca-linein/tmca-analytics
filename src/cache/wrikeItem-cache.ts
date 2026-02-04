import { axiosRequest } from "@/lib/axios";
import { WrikeFolder } from "@/types/wrikeItem";
import { LRUCache } from "lru-cache";

async function collectFoldersAndTasks(): Promise<WrikeFolder[]> {
    const { data } = await axiosRequest<{ data: WrikeFolder[] }>("GET", '/folders?fields=["space"]');
    const folders = data.data;
    return folders;
}

const DEFAULT_TTL_MS = 1000 * 60 * 60;
const MAX_ENTRIES = 1000;

const cache = new LRUCache({
    max: MAX_ENTRIES,
    ttl: DEFAULT_TTL_MS,
});

const inflight = new Map<string, Promise<WrikeFolder[]>>();

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
            const folders = await collectFoldersAndTasks();
            cache.set(foldersKey(userId), folders);
            return folders;
        } finally {
            inflight.delete(cKey);
        }
    })();

    inflight.set(cKey, p);
    return p;
}

export async function getFoldersForSession(userId: string) {
    const k = foldersKey(userId);
    const cached = cache.get(k) as WrikeFolder[] | undefined;
    if (cached) return cached;

    const result = await fetchAndPopulate(userId);
    return result;
}

export function invalidateSessionCache(userId: string) {
    cache.delete(foldersKey(userId));
    inflight.delete(combinedKey(userId));
}
