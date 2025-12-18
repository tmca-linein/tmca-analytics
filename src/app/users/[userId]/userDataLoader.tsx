import prisma from '@/lib/db';
import AppAreaChart from "@/components/AppAreaChart";
import { axiosRequest } from "@/lib/axios";
import AppUserStatistics from '@/components/AppUserStatistics';
import { ActivityItem, AppUserActivityWindow } from '@/components/AppUserActivityWindow';
import { AppCalendarView, AttentionItem } from '@/components/AppCalendarView';
import AppLineChart from '@/components/AppLineChart';
import { startOfDay, startOfWeek, startOfMonth, endOfDay, endOfMonth, endOfWeek } from 'date-fns';
import { getUserIdMapping } from "@/cache/legacyId-cache";
import { WrikeApiTasksResponse, WrikeTask } from '@/types/wrikeItem';
import { AxiosResponse } from 'axios';

export type AnfEventDailyStats = {
    date: string;
    added: number;
    removed: number;
};

async function fetchTaskActivity(userId: string): Promise<Record<string, number | WrikeTask[]>> {
    const [authoredTasksResponse, assignedTasksResponse] = await Promise.all([
        axiosRequest<WrikeApiTasksResponse>("GET", `/tasks?authors=[${userId}]`),
        axiosRequest<WrikeApiTasksResponse>(
            "GET",
            `/tasks?responsibles=[${userId}]&fields=[customFields]`
        ),
    ]);
    // authored tasks
    const authoredTasks = authoredTasksResponse.data.data ?? [];
    const authoredCompletedTasks = authoredTasks.filter(at => at.status === 'Completed');
    const authoredActiveTasks = authoredTasks.filter(at => at.status === 'Active');
    // assigned tasks
    const assignedTasks = assignedTasksResponse.data.data ?? [];
    const assignedCompletedTasks = assignedTasks.filter(at => at.status === 'Completed');
    const assignedActiveTasks = assignedTasks.filter(at => at.status === 'Active');
    // // next attention is needed:
    // const nain = assignedTasks.filter(at => at.customFields?.some(cf => cf.id === process.env.FIELD_NEXT_ATTENTION_NEEDED && cf.value != null))
    // // date that must be finished:
    // const dtmbf = assignedTasks.filter(at => at.customFields?.some(cf => cf.id === process.env.FIELD_DATE_THAT_MUST_BE_FINISHED && cf.value != null))

    return {
        authoredCreatedTasks: authoredTasks.length,
        authoredCompletedTasks: authoredCompletedTasks.length,
        authoredActiveTasks: authoredActiveTasks.length,
        assignedCreatedTasks: assignedTasks.length,
        assignedCompletedTasks: assignedCompletedTasks.length,
        assignedActiveTasks: assignedActiveTasks.length,
        // nainTasks: nain,
        // dtmbfTasks: dtmbf
    }
}

async function fetchANFActivity(userId: string | undefined, legacyUserId: string | undefined) {
    const now = new Date();
    const todayStart = startOfDay(now);
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const monthStart = startOfMonth(now);
    const todayEnd = endOfDay(now);
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const monthEnd = endOfMonth(now);
    const [row] = await prisma.$queryRaw<{
        addedToday: number;
        addedWeek: number;
        addedMonth: number;
        addedTotal: number;
        removedToday: number;
        removedWeek: number;
        removedMonth: number;
        removedTotal: number;
    }[]>`
    SELECT
        SUM(
            CASE
            WHEN state = 'ADDED'
            AND "authorUserId" <> ${userId}
            AND "eventDate" BETWEEN ${todayStart} AND ${todayEnd}
            THEN 1 ELSE 0
            END
        )::int AS "addedToday",
        SUM(
            CASE
            WHEN state = 'ADDED'
            AND "authorUserId" <> ${userId}
            AND "eventDate" BETWEEN ${weekStart} AND ${weekEnd}
            THEN 1 ELSE 0
            END
        )::int AS "addedWeek",
        SUM(
            CASE
            WHEN state = 'ADDED'
            AND "authorUserId" <> ${userId}
            AND "eventDate" BETWEEN ${monthStart} AND ${monthEnd}
            THEN 1 ELSE 0
            END
        )::int AS "addedMonth",
        SUM(
            CASE
            WHEN state = 'ADDED'
            AND "authorUserId" <> ${userId}
            THEN 1 ELSE 0
            END
        )::int AS "addedTotal",
        SUM(
            CASE
            WHEN state = 'REMOVED'
            AND "authorUserId" = ${userId}
            AND "eventDate" BETWEEN ${todayStart} AND ${todayEnd}
            AND EXISTS (
                SELECT 1
                FROM "CommentEvent" ce
                WHERE ce."wrikeItemId" = "ANFEvent"."wrikeItemId"
                AND ce."userId" = ${userId}
                AND ce."eventDate" BETWEEN
                    "ANFEvent"."eventDate" - INTERVAL '10 minutes'
                    AND "ANFEvent"."eventDate" + INTERVAL '10 minutes'
            )
            THEN 1 ELSE 0
            END
        )::int AS "removedToday",
        SUM(
            CASE
            WHEN state = 'REMOVED'
            AND "authorUserId" = ${userId}
            AND "eventDate" BETWEEN ${weekStart} AND ${weekEnd}
            AND EXISTS (
                SELECT 1
                FROM "CommentEvent" ce
                WHERE ce."wrikeItemId" = "ANFEvent"."wrikeItemId"
                AND ce."userId" = ${userId}
                AND ce."eventDate" BETWEEN
                    "ANFEvent"."eventDate" - INTERVAL '10 minutes'
                    AND "ANFEvent"."eventDate" + INTERVAL '10 minutes'
            )
            THEN 1 ELSE 0
            END
        )::int AS "removedWeek",
        SUM(
            CASE
            WHEN state = 'REMOVED'
            AND "authorUserId" = ${userId}
            AND "eventDate" BETWEEN ${monthStart} AND ${monthEnd}
            AND EXISTS (
                SELECT 1
                FROM "CommentEvent" ce
                WHERE ce."wrikeItemId" = "ANFEvent"."wrikeItemId"
                AND ce."userId" = ${userId}
                AND ce."eventDate" BETWEEN
                    "ANFEvent"."eventDate" - INTERVAL '10 minutes'
                    AND "ANFEvent"."eventDate" + INTERVAL '10 minutes'
            )
            THEN 1 ELSE 0
            END
        )::int AS "removedMonth",

        SUM(
            CASE
            WHEN state = 'REMOVED'
            AND "authorUserId" = ${userId}
            AND EXISTS (
                SELECT 1
                FROM "CommentEvent" ce
                WHERE ce."wrikeItemId" = "ANFEvent"."wrikeItemId"
                AND ce."userId" = ${userId}
                AND ce."eventDate" BETWEEN
                    "ANFEvent"."eventDate" - INTERVAL '10 minutes'
                    AND "ANFEvent"."eventDate" + INTERVAL '10 minutes'
            )
            THEN 1 ELSE 0
            END
        )::int AS "removedTotal"

    FROM "ANFEvent"
    WHERE "assignedUserId" = ${legacyUserId};
  `;
    return row;
}

type CommentStats = {
    countToday: number,
    countWeek: number,
    countMonth: number,
    countTotal: number,
    avgWordCountToday: number
    avgWordCountWeek: number
    avgWordCountMonth: number
}

async function fetchCommentActivity(userId: string | undefined): Promise<CommentStats> {
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);


    const [row] = await prisma.$queryRaw<
        {
            countToday: number;
            countWeek: number;
            countMonth: number;
            countTotal: number;
            avgWordCountToday: number;
            avgWordCountWeek: number;
            avgWordCountMonth: number;
        }[]
    >`
    SELECT
      SUM(CASE WHEN "eventDate" BETWEEN ${todayStart} AND ${todayEnd}
          THEN 1 ELSE 0 END)::int AS "countToday",
      SUM(CASE WHEN "eventDate" BETWEEN ${weekStart} AND ${weekEnd}
          THEN 1 ELSE 0 END)::int AS "countWeek",
      SUM(CASE WHEN "eventDate" BETWEEN ${monthStart} AND ${monthEnd}
          THEN 1 ELSE 0 END)::int AS "countMonth",
      COUNT(*)::int AS "countTotal",
      AVG(CASE WHEN "eventDate" BETWEEN ${todayStart} AND ${todayEnd}
         THEN "wordCount" END)::float AS "avgWordCountToday",
      AVG(CASE WHEN "eventDate" BETWEEN ${weekStart} AND ${weekEnd}
         THEN "wordCount" END)::float AS "avgWordCountWeek",
      AVG(CASE WHEN "eventDate" BETWEEN ${monthStart} AND ${monthEnd}
         THEN "wordCount" END)::float AS "avgWordCountMonth"
    FROM "CommentEvent"
    WHERE "userId" = ${userId};
  `;
    const safeRow = row ?? {
        countToday: 0,
        countWeek: 0,
        countMonth: 0,
        countTotal: 0,
        avgWordCountToday: 0,
        avgWordCountWeek: 0,
        avgWordCountMonth: 0,
    };

    return safeRow;
}

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

export default async function UserDataLoader(props: {
    userId: string;
}) {
    const { userId } = await props;
    const userIdsMapping = await getUserIdMapping();
    const legacyMappings = userIdsMapping.filter(m => m.id === userId)
    const legacyUserId = legacyMappings.length > 0 ? legacyMappings[0].apiV2Id : undefined;
    const [
        taskActivity,
        anfActivity,
        commentActivity,
        historicalANFData,
        historicalCommentData,
        lastANF,
        lastComment
    ] = await Promise.all([
        fetchTaskActivity(userId),
        fetchANFActivity(userId, legacyUserId),
        fetchCommentActivity(userId),
        // SUM(
        //     CASE
        //     WHEN state = 'ADDED'
        //     AND "authorUserId" <> ${userId}
        //     AND "eventDate" BETWEEN ${todayStart} AND ${todayEnd}
        //     THEN 1 ELSE 0
        //     END
        // )::int AS "addedToday",
        prisma.$queryRaw`
            SELECT
            TO_CHAR(DATE("eventDate"), 'YYYY-MM-DD') AS date,
            SUM(CASE WHEN "state" = 'ADDED' AND "authorUserId" <> ${userId}  THEN 1 ELSE 0 END)::int AS added,
            SUM(CASE WHEN "state" = 'REMOVED'  
                    AND "authorUserId" = ${userId}
                    AND EXISTS (
                        SELECT 1
                        FROM "CommentEvent" ce
                        WHERE ce."wrikeItemId" = "ANFEvent"."wrikeItemId"
                        AND ce."userId" = ${userId}
                        AND ce."eventDate" BETWEEN
                            "ANFEvent"."eventDate" - INTERVAL '10 minutes'
                            AND "ANFEvent"."eventDate" + INTERVAL '10 minutes'
                    )
            THEN 1 ELSE 0 END)::int AS removed
            FROM "ANFEvent"
            WHERE "assignedUserId" = ${legacyUserId}
            GROUP BY DATE("eventDate")
            ORDER BY DATE("eventDate")
        `,
        prisma.$queryRaw`
            SELECT
            TO_CHAR(DATE("eventDate"), 'YYYY-MM-DD') AS date,
            COUNT(*)::int AS desktop
            FROM "CommentEvent"
            WHERE "userId" = ${userId}
            GROUP BY DATE("eventDate")
            ORDER BY DATE("eventDate")
        `,
        prisma.aNFEvent.findMany({
            orderBy: {
                eventDate: "desc",
            },
            where: {
                assignedUserId: legacyUserId
            },
            take: 3,
        }),
        prisma.commentEvent.findMany({
            orderBy: {
                eventDate: "desc",
            },
            where: {
                userId: userId
            },
            take: 3,
        })
    ]);

    // const { nainTasks, dtmbfTasks } = taskActivity;
    // console.log(nainTasks);
    // const nainItems = (nainTasks as WrikeTask[]).map((nT, index) => {
    //     if (!nT.customFields) return;
    //     const nain = nT.customFields.filter(cf => cf.id === process.env.FIELD_NEXT_ATTENTION_NEEDED)[0];
    //     const nainDate = new Date(nain.value).toISOString().slice(0, 10);
    //     let status;
    //     const now = new Date().toISOString().slice(0, 10);
    //     if ((now < nainDate)) {
    //         status = 'upcoming';
    //     } else if (now === nainDate) {
    //         status = 'today';
    //     } else {
    //         status = 'overdue';
    //     }

    //     return {
    //         id: index,
    //         title: nT.title,
    //         description: `Importance: "${nT.importance}"`,
    //         time: `Created: ${new Date(nT.createdDate).toISOString().slice(0, 10)}`,
    //         date: nainDate,
    //         status: status
    //     } as AttentionItem
    // });

    // const dtmbfItems = (dtmbfTasks as WrikeTask[]).map((dT, index) => {
    //     if (!dT.customFields) return;
    //     const dtmbf = dT.customFields.filter(cf => cf.id === process.env.FIELD_DATE_THAT_MUST_BE_FINISHED)[0];
    //     const dtmbfDate = new Date(dtmbf.value).toISOString().slice(0, 10);
    //     let status;
    //     const now = new Date().toISOString().slice(0, 10);
    //     if (dT.status !== "Completed") {
    //         if ((now < dtmbfDate)) {
    //             status = 'upcoming';
    //         } else if (now === dtmbfDate) {
    //             status = 'today';
    //         } else {
    //             status = 'overdue';
    //         }
    //     } else {
    //         status = "completed"
    //     }

    //     return {
    //         id: index,
    //         title: dT.title,
    //         description: `Importance: "${dT.importance}"`,
    //         time: `Created: ${new Date(dT.createdDate).toISOString().slice(0, 10)}`,
    //         date: dtmbfDate,
    //         status: status,
    //         link: dT.permalink
    //     } as AttentionItem
    // });

    const anfTaskPromises = lastANF.map(value =>
        axiosRequest<WrikeApiTasksResponse>("GET", `/tasks/${value.wrikeItemId}`)
    );

    const commentTaskPromises = lastComment.map(value =>
        axiosRequest<WrikeApiTasksResponse>("GET", `/tasks/${value.wrikeItemId}`)
    );


    const [anfTaskResponses, commentTaskResponses] = await Promise.all([
        Promise.all(anfTaskPromises.map(with404Fallback)),
        Promise.all(commentTaskPromises.map(with404Fallback)),
    ])

    const anfActivities = lastANF.map((value, index) => {
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
            description: `User was ${value.state === "ADDED" ? "added to" : "removed from"
                } the task.`,
            type: "ANF",
            link: taskData.permalink
        };
    });

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

    const latest3 = [...anfActivities, ...commentActivities]
        .sort((a, b) => b.date.getTime() - a.date.getTime())
        .slice(0, 3)
        .map(a => ({ ...a, date: a.date.toISOString() })) as ActivityItem[];

    return (
        <>
            <div className="bg-primary-foreground p-4 rounded-lg"><AppUserActivityWindow items={latest3} /></div>
            <div className="bg-primary-foreground p-4 rounded-lg lg:col-span-2 xl:col-span-1 2xl:col-span-2">
                <AppAreaChart
                    chartTitle='📍Answer is needed from'
                    chartDesc="Displays ANF historical data"
                    chartData={historicalANFData as Record<string, string | number>[]}
                    xKey="date"
                    series={[
                        { key: "removed", label: "Removed", color: "var(--chart-1)" },
                        { key: "added", label: "Added", color: "var(--chart-2)" },
                    ]}
                    xType="date" />
            </div>
            <div className="bg-primary-foreground p-4 rounded-lg lg:col-span-2 xl:col-span-1 2xl:col-span-2">
                <AppLineChart
                    chartTitle="User comments"
                    chartDesc="Displays historical user activity based on placed comments"
                    chartData={historicalCommentData as Record<string, string | number>[]}
                    xKey="date"
                    series={[
                        { key: "desktop", label: "Comments", color: "var(--chart-4)" },
                    ]}
                    xType='date'
                />
            </div>
            <div className="bg-primary-foreground p-4 rounded-lg lg:col-span-2 xl:col-span-1 2xl:col-span-2">
                <AppUserStatistics taskActivity={taskActivity} anfActivity={anfActivity} commentActivity={commentActivity} />
            </div>
            {/* <div className="bg-primary-foreground p-4 rounded-lg">
                <AppCalendarView title="📍Next attention needed from assignee" items={nainItems as AttentionItem[]} />
            </div>
            <div className="bg-primary-foreground p-4 rounded-lg">
                <AppCalendarView title="📍Date that must be finished" items={dtmbfItems as AttentionItem[]} />
            </div> */}
        </>
    )
}