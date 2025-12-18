import { SpaceItem, WrikeApiFolderResponse, WrikeApiTasksResponse, WrikeSpace, WrikeTask } from "@/types/wrikeItem";
import { SpaceItemsTable } from "./SpaceItemsTable";
import { axiosRequest } from "@/lib/axios";
import { getUserName } from "@/cache/user-cache";
import { getChildrenBatch } from "./cachedWrikeItemRetriever";
import pLimit from 'p-limit';
const limit = pLimit(20);

type SpaceWithMetadata = WrikeSpace & {
    permalink: string;
    sharedIds: string[];
    childIds: string[];
}

function chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
}

async function getAllSpaceChildren(spaces: SpaceWithMetadata[]): Promise<SpaceItem[]> {
    const allChildIds = spaces.flatMap(s => s.childIds);
    if (allChildIds.length === 0) return [];

    // Batch fetch up to 100 folders at once (Wrike supports /folders/id1,id2,...)
    const batches: string[][] = [];
    for (let i = 0; i < allChildIds.length; i += 100) {
        batches.push(allChildIds.slice(i, i + 100));
    }

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
            taskChildIds: [],
            subRows: [],
            warning: "",
            sharedWith: (await Promise.all(
                f.sharedIds.map(getUserName)
            )).filter(Boolean)
                .join(", "),
            permalink: f.permalink,
        }))
    );

    return items;
}

async function getAllSpaceTasks(spaces: WrikeSpace[]): Promise<SpaceItem[]> {
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
                    parentId: space.id,
                }));
            })
        )
    ).flat();

    return Promise.all(
        allTasksWithParent.map(async ({ task, parentId }) => ({
            itemId: task.id,
            itemName: task.title,
            itemType: "Task" as const,
            author: task.authorIds?.[0] ? await getUserName(task.authorIds[0]) || "" : "",
            parentId,
            folderChildIds: [],
            taskChildIds: task.subTaskIds || [],
            subRows: [],
            warning: "",
            sharedWith: task.sharedIds?.length
                ? (await Promise.all(task.sharedIds.map(getUserName))).filter(Boolean).join(", ")
                : "",
            permalink: task.permalink,
        }))
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
            sharedWith: (await Promise.all(
                s.sharedIds.map(getUserName)
            )).filter(Boolean)
                .join(", "),
            permalink: s.permalink,
        })
    }));

    return [...spaceItems, ...childItems, ...taskItems];
};

const SpaceItemsPage = async () => {
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
