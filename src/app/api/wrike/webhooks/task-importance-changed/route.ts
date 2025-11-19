import { NextResponse } from "next/server";
import { withWrikeWebhook } from "@/lib/withWrikeWebhook";
import { TaskImportanceChangedPayload } from "../types";
import prisma from "@/lib/db";


async function handler(body: TaskImportanceChangedPayload) {
    return NextResponse.json({ ok: true });
}

export const POST = withWrikeWebhook<TaskImportanceChangedPayload>(handler);