import { NextResponse } from "next/server";
import prisma from '@/lib/db';
import type { WrikeCommentWebhookPayload } from "../types";

export async function POST(request: Request) {
    const body = await request.json() as WrikeCommentWebhookPayload[];

    for (const event of body) {
        const wordCount = event.comment.text
            .trim()
            .split(/\s+/)
            .filter(Boolean).length;
        const eventDate = new Date(event.lastUpdatedDate);
        await prisma.commentEvent.create({
            data: {
                userId: event.eventAuthorId ?? "",
                wrikeItemId: event.taskId ?? "",
                eventDate,
                wordCount
            },
        });
        console.log(`${eventDate}: COMMENT-ADDED: {User: ${event.eventAuthorId}, Task: ${event.taskId}, Length: ${wordCount}}`)
    }

    return NextResponse.json({ ok: true });
}