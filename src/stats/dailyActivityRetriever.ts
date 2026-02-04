import { getUserName } from '@/cache/user-cache';
import { ActivityItem } from '@/components/stats/AppActivityWindow';
import { ANFEvent, CommentEvent } from '@/generated/prisma';
import { axiosRequest } from '@/lib/axios';
import prisma from '@/lib/db';
import { chunkArray } from '@/lib/utils';
import { WrikeApiFolderResponse, WrikeApiTasksResponse, WrikeFolder, WrikeTask } from '@/types/wrikeItem';
import { startOfDay, endOfDay } from 'date-fns';

type TaskResult<T> =
    { ok: true; value: T }
    | { ok: false; status: 404; fallback: "NOT_FOUND" }
    | { ok: false; status?: number; error: unknown };

function with404Fallback<T>(p: Promise<T>): Promise<TaskResult<T>> {
    return p
        .then((value) => ({ ok: true as const, value }))
        .catch((err) => {
            const status = err?.response?.status ?? err?.status;
            if (status === 404) return { ok: false, status: 404, fallback: "NOT_FOUND" };
            return { ok: false as const, status, error: err };
        });
}

async function buildActivities(lastANF: ANFEvent[], lastComment: CommentEvent[]) {
    const tasksToFetch = [
        ...lastANF.filter(ae => ae.scope === 'TASK').map(a => a.wrikeItemId),
        ...lastComment.filter(ce => ce.scope === 'TASK').map(a => a.wrikeItemId)
    ];

    const taskChunks = chunkArray(tasksToFetch, 100);
    const taskChunkResponses = await Promise.all(
        taskChunks.map((chunk) =>
            with404Fallback(
                axiosRequest<WrikeApiTasksResponse>("GET", `/tasks/${chunk.join(",")}`)
            )
        )
    );

    const tasks: WrikeTask[] = taskChunkResponses.flatMap(r =>
        r.ok ? (r.value.data.data as WrikeTask[]) : []
    );
    const taskById = new Map(tasks.map(t => [t.id, t]));

    const projectsToFetch = [
        ...lastANF.filter(ae => ae.scope === 'FOLDER').map(a => a.wrikeItemId),
        ...lastComment.filter(ce => ce.scope === 'FOLDER').map(a => a.wrikeItemId)
    ];

    const projectChunks = chunkArray(projectsToFetch, 100);
    const projectChunkResponses = await Promise.all(
        projectChunks.map((chunk) =>
            with404Fallback(
                axiosRequest<WrikeApiFolderResponse>("GET", `/tasks/${chunk.join(",")}`)
            )
        )
    );

    const projects: WrikeFolder[] = projectChunkResponses.flatMap(r =>
        r.ok ? (r.value.data.data as WrikeFolder[]) : []
    );

    const projectById = new Map(projects.map(t => [t.id, t]));
    const anfActivities = await Promise.all(
        lastANF.map(async (value) => {
            const task = taskById.get(value.wrikeItemId) ?? projectById.get(value.wrikeItemId);
            const taskData = task
                ? task
                : { title: "***Task not found or not authorised***", permalink: "#" };

            return {
                id: value.id,
                title: taskData?.title ?? "(task)",
                date: value.eventDate,
                description: `${await getUserName(value.authorUserId)} ${value.state === "ADDED"
                    ? "added user to ANF field."
                    : "removed user from ANF field."
                    }`,
                type: "ANF",
                link: taskData.permalink
            };
        })
    );

    const commentActivities = await Promise.all(
        lastComment.map(async (value) => {
            const task = taskById.get(value.wrikeItemId) ?? projectById.get(value.wrikeItemId);
            const taskData = task
                ? task
                : { title: "***Task not found or not authorised***", permalink: "#" };

            return {
                id: value.id,
                title: taskData?.title ?? "(task)",
                date: value.eventDate,
                description: `${await getUserName(value.userId)} added a comment.`,
                type: "comment",
                link: taskData.permalink
            };
        })
    );

    const dayActivities = [...anfActivities, ...commentActivities]
        .sort((a, b) => b.date.getTime() - a.date.getTime())
        .map(a => ({ ...a, date: a.date.toISOString() })) as ActivityItem[];

    return dayActivities;
}

export async function fetchTaskDailyActivity(legacyUserId: string, userId: string) {
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);

    const lastANF = await prisma.$queryRaw<ANFEvent[]>`
        SELECT
        *
        FROM "ANFEvent"
        WHERE "assignedUserId" = ${legacyUserId}
        AND "eventDate" BETWEEN ${todayStart} AND ${todayEnd}
        ORDER BY "eventDate" DESC;
    `;

    const lastComment = await prisma.$queryRaw<CommentEvent[]>`
        SELECT
        *
        FROM "CommentEvent"
        WHERE "userId" = ${userId}
        AND "eventDate" BETWEEN ${todayStart} AND ${todayEnd}
        ORDER BY "eventDate" DESC;
    `;

    const dayActivities = await buildActivities(lastANF, lastComment);
    return dayActivities;
}

export async function fetchFolderDailyActivity(taskIds: string[]) {
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const lastANF = await prisma.$queryRaw<ANFEvent[]>`
        SELECT
        *
        FROM "ANFEvent"
        WHERE "wrikeItemId" = ANY(${taskIds})
        AND "eventDate" BETWEEN ${todayStart} AND ${todayEnd}
        ORDER BY "eventDate" DESC;
    `;

    const lastComment = await prisma.$queryRaw<CommentEvent[]>`
        SELECT
        *
        FROM "CommentEvent"
        WHERE "wrikeItemId" = ANY(${taskIds})
        AND "eventDate" BETWEEN ${todayStart} AND ${todayEnd}
        ORDER BY "eventDate" DESC;
    `;

    const dayActivities = await buildActivities(lastANF, lastComment);
    return dayActivities;
}