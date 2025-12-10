import { SpaceItem, WrikeApiFolderResponse, WrikeApiSpaceResponse, WrikeApiTasksResponse, WrikeSpace } from "@/types/wrikeItem";
import { SpaceItemsTable } from "./SpaceItemsTable";
import { axiosRequest } from "@/lib/axios";
import { getUserName } from "@/cache/user-cache";
import { getFolderTaskIds } from "./spaceHelpers";
import { getChildrenBatch } from "./cachedWrikeItemRetriever";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import pLimit from 'p-limit';
const limit = pLimit(10);

async function getSubRows(children: string[]): Promise<SpaceItem[]> {
  const rows = await Promise.all(
    children.map(async (cid) => limit(async () => {
      const subFolderResponse = await axiosRequest<WrikeApiFolderResponse>('GET', `/folders/${cid}`).catch(() => null);
      const item = subFolderResponse?.data?.data[0];
      if (!item) return undefined;
      const sharedNames = await Promise.all(
        item.sharedIds.map(getUserName)
      );
      const spaceItem: SpaceItem = {
        itemId: item.id,
        itemName: item.title,
        itemType: item.project ? "Project" : "Folder",
        author: item.project ? await getUserName(item.project.authorId) : "",
        folderChildIds: item.childIds,
        taskChildIds: await getFolderTaskIds(item.id),
        subRows: [],
        warning: "",
        sharedWith: sharedNames.filter(Boolean).join(", "),
        permalink: item.permalink
      };
      return spaceItem;
    })),
  );

  return rows.filter(r => !!r);
}

async function getSubTasks(spaceId: string): Promise<SpaceItem[]> {
  const tasks = await axiosRequest<WrikeApiTasksResponse>('GET', `/folders/${spaceId}/tasks?fields=["sharedIds", "authorIds", "subTaskIds"]`)
  const taskData = tasks?.data?.data;
  const rows = await Promise.all(
    taskData.map(async (t) => {
      const sharedNames = await Promise.all(
        t.sharedIds.map(getUserName)
      );

      const author = await getUserName(t.authorIds[0]);
      const spaceItem: SpaceItem = {
        itemId: t.id,
        itemName: t.title,
        itemType: "Task",
        author: author,
        folderChildIds: [],
        taskChildIds: t.subTaskIds,
        subRows: [],
        warning: "",
        sharedWith: sharedNames.filter(Boolean).join(", "),
        permalink: t.permalink
      };

      return spaceItem;
    }),
  );

  return rows.filter(r => !!r);
}

const fetchSpaceItems = async () => {
  const response = await axiosRequest<WrikeApiSpaceResponse>('GET', '/spaces')
  const rows: SpaceItem[] = [];
  const data = Array.from(response.data.data) as WrikeSpace[];
  const spaceDetails = await Promise.all(
    data.map((f) =>
      axiosRequest<WrikeApiFolderResponse>('GET', `/folders/${f.id}?fields=["space"]`).catch(() => null)
    )
  );

  const spaceInfo = await Promise.all(
    spaceDetails.map(async (res, i) => {
      if (!res) return null;
      const folder = res.data.data[0];
      const sharedNames = await Promise.all(
        folder.sharedIds.map(getUserName)
      );

      const subRows = await getSubRows(folder.childIds);
      rows.push(...subRows);
      const spaceTasks = await getSubTasks(folder.id);
      const taskIds = spaceTasks.map(t => {
        return t.itemId;
      });
      rows.push(...spaceTasks);


      return {
        ...data[i],
        permalink: folder.permalink,
        sharedWith: sharedNames.filter(Boolean).join(", "),
        folderChilds: folder.childIds,
        taskChilds: taskIds
      };
    })
  );

  if (!spaceInfo) return [];
  spaceInfo.forEach((item) => {
    if (!item) return;
    const spaceItem: SpaceItem = {
      itemId: item.id,
      itemName: item.title,
      itemType: "Space",
      author: "",
      folderChildIds: item.folderChilds,
      taskChildIds: item.taskChilds,
      subRows: [],
      warning: "",
      sharedWith: item.sharedWith,
      permalink: item.permalink
    };

    rows.push(spaceItem);
  });

  return rows;
};


const SpaceItemsPage = async () => {
  const data = await fetchSpaceItems();
  return (
    <>
      <div className="mb-8 px-4 py-2 bg-secondary rounded-md">
        <h1 className="font-semibold">Space overview</h1>
      </div>
      <div className="flex-1 overflow-hidden">
        <SpaceItemsTable initialData={data} dataFetcher={getChildrenBatch}/>
      </div>
    </>
  );
};

export default SpaceItemsPage;
