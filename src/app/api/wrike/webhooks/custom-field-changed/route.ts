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
                },
            });
            console.log(`ADDED: Task ${taskId} → ${userId}`);
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
                },
            });
            console.log(`REMOVED: Task ${taskId} → ${userId}`);
        }
    }

    return NextResponse.json({ ok: true });
}