import { NextResponse } from "next/server";
import { withWrikeWebhook } from "@/lib/withWrikeWebhook";
import { TaskSharedsAddedPayload } from "../types";
import prisma from "@/lib/db";


async function handler(body: TaskSharedsAddedPayload) {
    const taskId = body.taskId;
    body.addedShareds.map(async (u) => {
        await prisma.wrikeUserItems.create({
            data: {
                userId: u,
                wrikeItemId: taskId,
            },
        })
    })

    return NextResponse.json({ ok: true });
}

export const POST = withWrikeWebhook<TaskSharedsAddedPayload>(handler);