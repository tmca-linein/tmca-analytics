import { NextResponse } from "next/server";
import prisma from '@/lib/db';
import type { CustomFieldChangedPayload } from "../types";

export async function POST(request: Request) {
    const body = await request.json() as CustomFieldChangedPayload[];

    for (const event of body) {
        const oldUserIds = (event.oldValue || "")
            .replace(/^"|"$/g, "")
            .split(",")
            .map((id) => id.trim())
            .filter(Boolean);

        const newUserIds = (event.value || "")
            .replace(/^"|"$/g, "")
            .split(",")
            .map((id) => id.trim())
            .filter(Boolean);

        const taskId = event.taskId;
        const eventDate = new Date(event.lastUpdatedDate);

        // === Users that were ADDED ===
        const addedUserIds = newUserIds.filter((id) => !oldUserIds.includes(id));
        for (const userId of addedUserIds) {
            await prisma.aNFEvent.create({
                data: {
                    assignedUserId: userId,
                    wrikeItemId: taskId ?? "",
                    state: "ADDED",
                    eventDate,
                    authorUserId: event.eventAuthorId
                },
            });
            console.log(`${eventDate}: CUSTOM-FIELD-CHANGED: {State: ADDED, Task: ${taskId}, RemovedUser: ${userId}, Author: ${event.eventAuthorId}}`);
        }

        // === Users that were REMOVED ===
        const removedUserIds = oldUserIds.filter((id) => !newUserIds.includes(id));
        for (const userId of removedUserIds) {
            await prisma.aNFEvent.create({
                data: {
                    assignedUserId: userId,
                    wrikeItemId: taskId ?? "",
                    state: "REMOVED",
                    eventDate,
                    authorUserId: event.eventAuthorId
                },
            });
            console.log(`${eventDate}: CUSTOM-FIELD-CHANGED: {State: REMOVED, Task: ${taskId}, RemovedUser: ${userId}, Author: ${event.eventAuthorId}}`);
        }
    }

    return NextResponse.json({ ok: true });
}