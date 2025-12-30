import { SpaceItem, WrikeApiFolderResponse, WrikeApiTasksResponse, WrikeSpace, WrikeTask } from "@/types/wrikeItem";
import { SpaceItemsTable } from "./SpaceItemsTable";
import { axiosRequest } from "@/lib/axios";
import { cacheAncestorMappings, getAllParents, getUserName } from "@/cache/user-cache";
import { getChildrenBatch, getFolderTaskIds } from "./serverSpaceHelpers";
import pLimit from 'p-limit';
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { redirect } from "next/navigation";
import { chunkArray } from "./spaceHelpers";
const limit = pLimit(5);

type SpaceWithMetadata = WrikeSpace & {
    permalink: string;
    sharedIds: string[];
    childIds: string[];
}

async function getAllSpaceChildren(spaces: SpaceWithMetadata[]): Promise<SpaceItem[]> {
    const allChildIds = spaces.flatMap(s => s.childIds);
    if (allChildIds.length === 0) return [];

    const folderChunks = chunkArray(allChildIds, 100);
    const allFolderResponses = await Promise.all(
        folderChunks.map((chunk) =>
            limit(() => axiosRequest<WrikeApiFolderResponse>('GET', `/folders/${chunk.join(',')}`))
        )
    );

    const childFolders = allFolderResponses.flatMap(r => r.data.data);
    const items: SpaceItem[] = await Promise.all(
        childFolders.map(async f => ({
            itemId: f.id,
            itemName: f.title,
            itemType: f.project ? "Project" : "Folder",
            author: f.project?.authorId ? await getUserName(f.project.authorId) || "" : "",
            folderChildIds: f.childIds || [],
            taskChildIds: await getFolderTaskIds(f.id),
            subRows: [],
            warning: "",
            sharedIds: f.sharedIds,
            sharedWith: (await Promise.all(
                f.sharedIds.filter(sid => sid !== process.env.MAIN_UID).map(getUserName)
            )).filter(Boolean)
                .join(", "),
            permalink: f.permalink,
        }))
    );

    return items;
}

async function getAllSpaceTasks(spaces: SpaceWithMetadata[]): Promise<SpaceItem[]> {
    const allTasksWithParent = (
        await Promise.all(
            spaces.map(async (space) => {
                const res = await limit(() =>
                    axiosRequest<WrikeApiTasksResponse>('GET', `/folders/${space.id}/tasks`, {
                        params: { fields: '["sharedIds","authorIds","subTaskIds"]' }
                    }).catch(() => ({ data: { data: [] } }))
                );

                return res.data.data.map((task: WrikeTask) => ({
                    task,
                    parent: space,
                }));
            })
        )
    ).flat();

    return Promise.all(
        allTasksWithParent.map(async ({ task, parent }) => {
            const parentSharedSet = new Set(parent.sharedIds);
            // check if user or any of its parents are in the parent folder sharedIds.
            const warnings: string[] = [];
            for (const sid of task.sharedIds ?? []) {
                if (parentSharedSet.has(sid)) continue;

                const parents = getAllParents(sid) ?? [];
                let covered = false;
                for (const pid of parents) {
                    if (parentSharedSet.has(pid)) { covered = true; break; }
                }
                if (!covered) {
                    warnings.push(`User ${sid} was explictly shared on a task level but not on a folder level!`);
                }
            }

            const warning = warnings.join("; ");
            return ({
                itemId: task.id,
                itemName: task.title,
                itemType: "Task" as const,
                author: task.authorIds?.[0] ? await getUserName(task.authorIds[0]) || "" : "",
                parentId: parent.id,
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
            })
        })
    );
}

async function fetchSpacesWithMetadata(): Promise<SpaceWithMetadata[]> {
    const { data } = await axiosRequest<{ data: WrikeSpace[] }>('GET', '/spaces');
    const spaces = data.data;

    const folderResponses = await Promise.all(
        spaces.map(space =>
            limit(() => axiosRequest<WrikeApiFolderResponse>('GET', `/folders/${space.id}`))
        )
    );

    return spaces.map((space, i) => {
        const folder = folderResponses[i]?.data?.data?.[0];
        if (!folder) return { ...space, permalink: "", sharedIds: [], childIds: [] };
        return {
            ...space,
            permalink: folder.permalink,
            sharedIds: folder.sharedIds || [],
            childIds: folder.childIds || [],
        };
    });
}

const fetchSpaceItems = async (): Promise<SpaceItem[]> => {
    await cacheAncestorMappings();
    const spaces = await fetchSpacesWithMetadata();
    const [childItems, taskItems] = await Promise.all([
        getAllSpaceChildren(spaces),
        getAllSpaceTasks(spaces),
    ]);

    const spaceItems: SpaceItem[] = await Promise.all(spaces.map(async s => {
        return ({
            itemId: s.id,
            itemName: s.title,
            itemType: "Space",
            author: "",
            folderChildIds: s.childIds || [],
            taskChildIds: taskItems.filter(t => t.parentId === s.id).map(t => t.itemId),
            subRows: [],
            warning: "",
            sharedIds: s.sharedIds,
            sharedWith: (await Promise.all(
                s.sharedIds.filter(sid => sid !== process.env.MAIN_UID).map(getUserName)
            )).filter(Boolean)
                .join(", "),
            permalink: s.permalink,
        })
    }));

    return [...spaceItems, ...childItems, ...taskItems];
};

const SpaceItemsPage = async () => {
    const session = await getServerSession(authConfig);
    const isAuthenticated = !!session && (session?.error !== "RefreshAccessTokenError");

    if (!isAuthenticated) {
        redirect('/login');
    }

    const data = await fetchSpaceItems();
    return (
        <>
            <div className="mb-8 px-4 py-2 bg-secondary rounded-md">
                <h1 className="font-semibold">Space overview</h1>
            </div>
            <div className="flex-1 overflow-hidden">
                <SpaceItemsTable initialData={data} dataFetcher={getChildrenBatch} />
            </div>
        </>
    );
};

export default SpaceItemsPage;
