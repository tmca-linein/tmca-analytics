import { NextResponse } from "next/server";
import { withWrikeWebhook } from "@/lib/withWrikeWebhook";
import { TaskSharedsRemovedPayload } from "../types";
import prisma from "@/lib/db";


async function handler(body: TaskSharedsRemovedPayload) {
    const taskId = body.taskId;
    body.removedShareds.map(async (u) => {
        await prisma.wrikeUserItems.delete({
            where: {
                userId_wrikeItemId: {
                    userId: u,
                    wrikeItemId: taskId,
                },
            },
        });
    })

    return NextResponse.json({ ok: true });
}

export const POST = withWrikeWebhook<TaskSharedsRemovedPayload>(handler);