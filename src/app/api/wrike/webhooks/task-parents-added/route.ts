import { NextResponse } from "next/server";
import { withWrikeWebhook } from "@/lib/withWrikeWebhook";
import { TaskParentsAddedPayload } from "../types";
import prisma from "@/lib/db";


async function handler(body: TaskParentsAddedPayload) {

    // I dont get this
    return NextResponse.json({ ok: true });
}

export const POST = withWrikeWebhook<TaskParentsAddedPayload>(handler);