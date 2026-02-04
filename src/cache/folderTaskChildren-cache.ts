import prisma from "@/lib/db";
import { isoTomorrowAtUTC } from "@/lib/utils";
import { WrikeFolderTask } from "@/types/wrikeItem";

const folderTasksCache = new Map<string, string[]>();
let NEXT_UPDATE_DATE: string;
let inflight: Promise<void> | undefined;

async function fetchFolderTasks(): Promise<void> {
    if (inflight) return inflight;
    const p = (async (): Promise<void> => {
        try {
            const table = await prisma.$queryRaw<WrikeFolderTask[]>`
                SELECT
                    "rootId",
                    "descendantId"
                FROM "WrikeItemDirectDependency";
            `;
            table.forEach(e => {
                const descendants = folderTasksCache.get(e.rootId) ?? [];
                descendants.push(e.descendantId);
                folderTasksCache.set(e.rootId, descendants);
            });
        } catch {
            return;
        } finally {
            inflight = undefined;
        }
    })();

    inflight = p;
    return inflight;
}

export async function getFolderTaskIds(parentId: string): Promise<string[]> {
    const folderCacheExpired = NEXT_UPDATE_DATE ? new Date().toISOString() > NEXT_UPDATE_DATE : true;
    if (folderCacheExpired) {
        folderTasksCache.clear();
        await fetchFolderTasks();
        NEXT_UPDATE_DATE = isoTomorrowAtUTC();
    }

    const tasks = folderTasksCache.get(parentId) ?? [];
    return tasks;
}
