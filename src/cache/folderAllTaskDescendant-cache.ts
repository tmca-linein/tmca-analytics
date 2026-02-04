import prisma from "@/lib/db";
import { isoTomorrowAtUTC } from "@/lib/utils";
import { WrikeFolderTask } from "@/types/wrikeItem";

type Descendants = { folder: string[], task: string[] };
const folderDescendantsCache = new Map<string, Descendants>();
let NEXT_UPDATE_DATE: string;
let inflight: Promise<void> | undefined;

async function fetchFolderDescendants(): Promise<void> {
    if (inflight) return inflight;
    const p = (async (): Promise<void> => {
        try {
            const table = await prisma.$queryRaw<WrikeFolderTask[]>`
                SELECT
                    "rootId",
                    "descendantId"
                FROM "WrikeItemDependency";
            `;
            table.forEach(e => {
                const descendants = folderDescendantsCache.get(e.rootId) ?? { folder: [], task: [] };
                if (e.rootId === e.descendantId) {
                    descendants.folder.push(e.descendantId);
                } else {
                    descendants.task.push(e.descendantId);
                }

                folderDescendantsCache.set(e.rootId, descendants);
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

export async function getFolderDescendantIds(parentId: string): Promise<Descendants> {
    const folderCacheExpired = NEXT_UPDATE_DATE ? new Date().toISOString() > NEXT_UPDATE_DATE : true;
    if (folderCacheExpired) {
        folderDescendantsCache.clear();
        await fetchFolderDescendants();
        NEXT_UPDATE_DATE = isoTomorrowAtUTC();
    }

    return folderDescendantsCache.get(parentId) ?? { folder: [], task: [] };
}
