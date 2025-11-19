import { NextResponse } from "next/server";
import { withWrikeWebhook } from "@/lib/withWrikeWebhook";
import { TaskCreatedPayload } from "../types";
import { axiosRequest } from "@/lib/axios";
import { WrikeApiTaskResponse, WrikeTaskData } from "../../types";
import prisma from "@/lib/db";


async function handler(body: TaskCreatedPayload) {
    // 1. use task id to fetch created task from wrike
    // 2. get task parendid
    // 3. try to load parent from db 
    // 4. map task to parent
    const taskId = body.taskId;
    const taskReqResult = await axiosRequest<WrikeApiTaskResponse>('GET', `/tasks/${taskId}`, null, process.env.WRIKE_SYNC_ACCESS_TOKEN)
    const taskData = taskReqResult.data.data[0] as WrikeTaskData;
    const parentId = taskData?.parentIds[0];
    await prisma.wrikeItem.create({
        data: {
            id: taskId,
            title: taskData.title,
            itemType: "Task",
            authorId: taskData.authorIds[0],
            parentId: parentId,
            warning: "",
            permalink: taskData.permalink,
            createdAt: new Date(body.lastUpdatedDate),
            updatedAt: new Date(body.lastUpdatedDate),
        },
    });

    return NextResponse.json({ ok: true });
}

export const POST = withWrikeWebhook<TaskCreatedPayload>(handler);