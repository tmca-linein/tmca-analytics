import { NextResponse } from "next/server";
import { withWrikeWebhook } from "@/lib/withWrikeWebhook";
import { TaskDeletedPayload } from "../types";
import prisma from "@/lib/db";


async function handler(body: TaskDeletedPayload) {
    // 1. use task id to delete task from db
    const taskId = body.taskId;
    await prisma.wrikeItem.delete({
        where: { id: taskId },
    });
    return NextResponse.json({ ok: true });
}

export const POST = withWrikeWebhook<TaskDeletedPayload>(handler);