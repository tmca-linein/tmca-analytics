"use server";

import { cache } from "react";
import { getUserName } from '@/cache/user-cache';
import { axiosRequest } from '@/lib/axios';
import { SpaceItem, WrikeApiFolderResponse, WrikeApiTasksResponse, WrikeFolder } from '@/types/wrikeItem';
import { getFolderTaskIds } from "./spaceHelpers";

function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

export const getChildrenBatch = cache(async (parents: string[][]): Promise<SpaceItem[]> => {
  const folderTypeParents = parents[0];
  const taskTypeParents = parents[1];
  const result: SpaceItem[] = [];

  if (folderTypeParents.length > 0) {
    // fetch second level folders 
    const response = await axiosRequest<WrikeApiFolderResponse>(
      'GET',
      `/folders/${folderTypeParents.join(',')}`
    ).catch(() => null);
    const folders = response?.data?.data ?? [];
    // save folder level
    await Promise.all(
      folders.map(async folder => {
        const sharedNames = await Promise.all(
          folder.sharedIds.map(getUserName)
        );
        const spaceItem: SpaceItem = {
          itemId: folder.id,
          itemName: folder.title,
          itemType: folder.project ? "Project" : "Folder",
          author: folder.project ? await getUserName(folder.project.authorId) : "",
          folderChildIds: folder.childIds,
          taskChildIds: await getFolderTaskIds(folder.id),
          subRows: [], // will be filled on-demand
          warning: "",
          sharedWith: sharedNames.filter(Boolean).join(", "),
          permalink: folder.permalink,
        };

        result.push(spaceItem);
      })
    );
  }

  if (taskTypeParents.length > 0) {
    const taskChunks = chunkArray(taskTypeParents, 100);
    const taskResponses = await Promise.all(
      taskChunks.map((chunk) =>
        axiosRequest<WrikeApiTasksResponse>(
          "GET",
          `/tasks/${chunk.join(",")}`
        ).catch(() => ({ data: { data: [] } }))
      )
    );

    const allTasks = taskResponses.flatMap((res) => res.data.data);
    for (const task of allTasks) {
      const sharedWith = (await Promise.all(task.sharedIds.map(getUserName)))
        .filter(Boolean)
        .join(", ");
      const author = task.authorIds?.[0]
        ? await getUserName(task.authorIds[0])
        : "";

      result.push({
        itemId: task.id,
        itemName: task.title,
        itemType: "Task",
        author,
        folderChildIds: [],
        taskChildIds: task.subTaskIds || [],
        subRows: [],
        warning: "",
        sharedWith,
        permalink: task.permalink,
      });
    }
  }


  return result;
});