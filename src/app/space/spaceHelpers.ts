import { axiosRequest } from "@/lib/axios";
import { WrikeApiTasksResponse } from "@/types/wrikeItem";

export async function getFolderTaskIds(parentId: string) {
    const tasks = await axiosRequest<WrikeApiTasksResponse>('GET', `/folders/${parentId}/tasks?fields=["sharedIds", "authorIds", "subTaskIds"]`)
    const taskData = tasks?.data?.data;
    const taskIds = taskData.map(t => t.id);
    return taskIds;
}
