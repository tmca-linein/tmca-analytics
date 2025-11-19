import { NextResponse } from "next/server";
import { withWrikeWebhook } from "@/lib/withWrikeWebhook";
import { TaskTitleChangedPayload } from "../types";
import prisma from "@/lib/db";


async function handler(body: TaskTitleChangedPayload) {
    // 1. use task id to update task title in the db
    const taskId = body.taskId;
    await prisma.wrikeItem.update({
        where: { id: taskId },
        data: {
            title: body.title,
            updatedAt: new Date(body.lastUpdatedDate),
        },
    });
    return NextResponse.json({ ok: true });
}

export const POST = withWrikeWebhook<TaskTitleChangedPayload>(handler);