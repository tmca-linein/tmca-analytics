import { NextResponse } from "next/server";
import prisma from '@/lib/db';
import type { WrikeCommentWebhookPayload } from "../types";

export async function POST(request: Request) {
    const body = await request.json() as WrikeCommentWebhookPayload[];

    for (const event of body) {
        const eventDate = new Date(event.lastUpdatedDate);
        await prisma.commentEvent.create({
            data: {
                userId: event.eventAuthorId ?? "",
                wrikeItemId: event.taskId ?? "",
                eventDate,
            },
        });
    }

    return NextResponse.json({ ok: true });
}