import { WrikeFolder, WrikeTask } from "@/types/wrikeItem";
import { getFoldersForSession, getTasksForSession } from "./wrikeItem-cache";


const descendantsMemo = new Map<string, Set<string>>();
const TTL_MS = 12 * 60 * 60 * 1000;
let memoExpires: number;


function memoDescendants(adj: Map<string, string[]>) {
    const now = Date.now();
    if (!memoExpires || memoExpires < now) {
        descendantsMemo.clear();
        memoExpires = Date.now() + TTL_MS;
    }

    const visiting = new Set<string>();
    const dfs = (id: string): Set<string> => {
        const cached = descendantsMemo.get(id);
        if (cached) return cached;

        if (visiting.has(id)) return new Set();
        visiting.add(id);
        const out = new Set<string>();
        const children = adj.get(id) ?? [];
        for (const c of children) {
            out.add(c);
            const sub = dfs(c);
            for (const x of sub) out.add(x);
        }

        visiting.delete(id);
        descendantsMemo.set(id, out);
        return out;
    };

    return dfs;
}

function buildAdj(folders: WrikeFolder[], tasks: WrikeTask[]): Map<string, string[]> {
    const adj = new Map();
    // folder -> child folders
    for (const f of folders) {
        if (f.childIds?.length) {
            adj.set(f.id, [...(adj.get(f.id) ?? []), ...f.childIds]);
        }
    }

    // task -> subtasks
    for (const t of tasks) {
        if (t.subTaskIds?.length) {
            adj.set(t.id, [...(adj.get(t.id) ?? []), ...t.subTaskIds]);
        }
    }

    // folder -> direct tasks 
    const folderToTasks = new Map<string, string[]>();
    for (const t of tasks) {
        for (const pid of (t.parentIds ?? [])) {
            const arr = folderToTasks.get(pid);
            if (arr) arr.push(t.id);
            else folderToTasks.set(pid, [t.id]);
        }
    }

    for (const [folderId, taskIds] of folderToTasks) {
        adj.set(folderId, [...(adj.get(folderId) ?? []), ...taskIds]);
    }

    return adj;
}

export async function getSelectedFolderTasksTraversal(userId: string, folderId: string): Promise<string[]> {
    const tasks = await getTasksForSession(userId);
    const folders = await getFoldersForSession(userId);

    const adj = buildAdj(folders, tasks);
    const dfsDesc = memoDescendants(adj);
    return [folderId, ...dfsDesc(folderId)];
}


export function getBulkFolderTasksTraversal(folders: WrikeFolder[], tasks: WrikeTask[]): string {
    const adj = buildAdj(folders, tasks);
    const dfsDesc = memoDescendants(adj);
    const mappings = [];
    for (const folder of folders) {
        mappings.push({ root_id: folder.id, wrikeItemIds: [...dfsDesc(folder.id), folder.id] });
    }

    for (const task of tasks) {
        mappings.push({ root_id: task.id, wrikeItemIds: [...dfsDesc(task.id), task.id] });
    }

    return JSON.stringify(mappings);
}