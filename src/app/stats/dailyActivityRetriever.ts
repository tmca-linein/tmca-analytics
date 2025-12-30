import { getUserName } from '@/cache/user-cache';
import { ActivityItem } from '@/app/users/[userId]/UserActivityWindow';
import { ANFEvent } from '@/generated/prisma';
import { axiosRequest } from '@/lib/axios';
import prisma from '@/lib/db';
import { WrikeApiTasksResponse } from '@/types/wrikeItem';
import { startOfDay, endOfDay } from 'date-fns';
import pLimit from 'p-limit';
const limit = pLimit(5);

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

export async function fetchDailyActivity(legacyUserId: string | undefined) {

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

    const lastComment = await prisma.$queryRaw<ANFEvent[]>`
        SELECT
        *
        FROM "CommentEvent"
        WHERE "userId" = ${legacyUserId}
        AND "eventDate" BETWEEN ${todayStart} AND ${todayEnd}
        ORDER BY "eventDate" DESC;
    `;

    // wrike returns empty array if any element is unauthorized for /tasks/task1,task2,...
    // this is slower workaround
    const anfTaskPromises = lastANF.map(value =>
        axiosRequest<WrikeApiTasksResponse>("GET", `/tasks/${value.wrikeItemId}`)
    );

    const commentTaskPromises = lastComment.map(value =>
        axiosRequest<WrikeApiTasksResponse>("GET", `/tasks/${value.wrikeItemId}`)
    );

    const [anfTaskResponses, commentTaskResponses] = await Promise.all([
        Promise.all(anfTaskPromises.map(with404Fallback)),
        Promise.all(commentTaskPromises.map(with404Fallback)),
    ]);

    const anfActivities = await Promise.all(
        lastANF.map((value, index) => limit(
            async () => {
                const taskDataResponse = anfTaskResponses[index]
                const taskData = taskDataResponse.ok ?
                    taskDataResponse.value.data.data[0] :
                    (taskDataResponse.status === 404 ?
                        { title: '***You are not authorised to view this task***', permalink: '#' } :
                        { title: "Error occurred while loading the task!", permalink: '#' });
                return {
                    id: value.id,
                    title: taskData?.title ?? "(task)",
                    date: value.eventDate,
                    description: `${await getUserName(value.authorUserId)} ${value.state === "ADDED" ? "added user to" : "removed user from"
                        } the task.`,
                    type: "ANF",
                    link: taskData.permalink
                };
            })
        )
    );

    const commentActivities = lastComment.map((value, index) => {
        const taskDataResponse = commentTaskResponses[index]
        const taskData = taskDataResponse.ok ?
            taskDataResponse.value.data.data[0] :
            (taskDataResponse.status === 404 ?
                { title: '***You are not authorised to view this task***', permalink: '#' } :
                { title: "Error occurred while loading the task!", permalink: '#' });
        return {
            id: value.id,
            title: taskData?.title ?? "(task)",
            date: value.eventDate,
            description: "User added a comment.",
            type: "comment",
            link: taskData.permalink
        };
    });

    const dayActivities = [...anfActivities, ...commentActivities]
        .sort((a, b) => b.date.getTime() - a.date.getTime())
        .map(a => ({ ...a, date: a.date.toISOString() })) as ActivityItem[];


    return dayActivities;
}