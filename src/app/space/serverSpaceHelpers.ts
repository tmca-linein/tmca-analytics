"use server";

import { cache } from "react";
import { getAllParents, getUserName } from '@/cache/user-cache';
import { axiosRequest } from '@/lib/axios';
import { SpaceItem, WrikeApiFolderResponse, WrikeApiTasksResponse } from '@/types/wrikeItem';
import { chunkArray } from "./spaceHelpers";

export type ItemChildrenIds = {
    folderChildIds: string[];
    taskChildIds: string[];
}

export const getChildrenBatch = cache(async (parent: SpaceItem, children: ItemChildrenIds): Promise<SpaceItem[]> => {
    const folderTypeChildren = children.folderChildIds;
    const taskTypeChildren = children.taskChildIds;
    const result: SpaceItem[] = [];

    if (folderTypeChildren.length > 0) {
        // fetch second level folders 
        const response = await axiosRequest<WrikeApiFolderResponse>(
            'GET',
            `/folders/${folderTypeChildren.join(',')}`
        ).catch(() => null);
        const folders = response?.data?.data ?? [];
        // save folder level
        await Promise.all(
            folders.map(async folder => {
                const sharedNames = await Promise.all(
                    folder.sharedIds
                        .filter(sid => sid !== process.env.MAIN_UID)
                        .map(getUserName)
                );
                const spaceItem: SpaceItem = {
                    itemId: folder.id,
                    itemName: folder.title,
                    itemType: folder.project ? "Project" : "Folder",
                    author: folder.project ? await getUserName(folder.project.authorId) : "",
                    folderChildIds: folder.childIds,
                    taskChildIds: await getFolderTaskIds(folder.id), // for each fetched folder type child check 3rd level task ids
                    subRows: [], // will be filled on-demand
                    warning: "",
                    sharedIds: folder.sharedIds,
                    sharedWith: sharedNames.filter(Boolean).join(", "),
                    permalink: folder.permalink,
                };

                result.push(spaceItem);
            })
        );
    }

    const parentSharedSet = new Set(parent.sharedIds);
    if (taskTypeChildren.length > 0) {
        const taskChunks = chunkArray(taskTypeChildren, 100);
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
            const sharedWith = (await Promise.all(task.sharedIds
                .filter(sid => sid !== process.env.MAIN_UID)
                .map(getUserName)))
                .filter(Boolean)
                .join(", ");

            const author = task.authorIds?.[0]
                ? await getUserName(task.authorIds[0])
                : "";

            const warnings: string[] = [];
            for (const sid of task.sharedIds ?? []) {
                if (parentSharedSet.has(sid)) continue;

                const parents = getAllParents(sid) ?? [];
                let covered = false;
                for (const pid of parents) {
                    if (parentSharedSet.has(pid)) { covered = true; break; }
                }
                if (!covered) {
                    warnings.push(`${await getUserName(sid)} was explictly shared on a task level but not on a folder level!`);
                }
            }

            const warning = warnings.join("; ");

            result.push({
                itemId: task.id,
                itemName: task.title,
                itemType: "Task",
                author,
                folderChildIds: [],
                taskChildIds: task.subTaskIds || [],
                subRows: [],
                warning,
                sharedIds: task.sharedIds,
                sharedWith,
                permalink: task.permalink,
            });
        }
    }


    return result;
});

export async function getFolderTaskIds(parentId: string) {
    const tasks = await axiosRequest<WrikeApiTasksResponse>('GET', `/folders/${parentId}/tasks?fields=["sharedIds", "authorIds", "subTaskIds"]`)
    const taskData = tasks?.data?.data;
    const taskIds = taskData.map(t => t.id);
    return taskIds;
}