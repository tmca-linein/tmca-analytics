import prisma from '@/lib/db';
import { redirect } from "next/navigation";
import AppAreaChart from "@/components/AppAreaChart";
import { axiosRequest } from "@/lib/axios";
import { WrikeApiContactsResponse } from "@/types/user";
import AppUserDescription from '@/components/AppUserDescription';
import AppUserStatistics from '@/components/AppUserStatistics';
import { AppUserActivityWindow } from '@/components/AppUserActivityWindow';
import { AppCalendarView } from '@/components/AppCalendarView';
import AppLineChart from '@/components/AppLineChart';
import { addDays, isSameDay, startOfDay, startOfWeek, startOfMonth, endOfDay, endOfMonth, endOfWeek } from 'date-fns';
import { getServerSession } from "next-auth";
import { getUserIdMapping } from "@/cache/legacyId-cache";
import { authConfig } from "@/lib/auth";

export type AnfEventDailyStats = {
    date: string;
    added: number;
    removed: number;
};

async function fetchTaskActivity(userId: string) {
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
    // next attention is needed:
    const nain = assignedTasks.filter(at => at.customFields?.some(cf=> cf.id === process.env.FIELD_NEXT_ATTENTION_NEEDED && cf.value != null))
    // date that must be finished:
    const dtmbf = assignedTasks.filter(at => at.customFields?.some(cf=> cf.id === process.env.FIELD_DATE_THAT_MUST_BE_FINISHED && cf.value != null))

    return {
        authoredCreatedTasks: authoredTasks.length,
        authoredCompletedTasks: authoredCompletedTasks.length,
        authoredActiveTasks: authoredActiveTasks.length,
        assignedCreatedTasks: assignedTasks.length,
        assignedCompletedTasks: assignedCompletedTasks.length,
        assignedActiveTasks: assignedActiveTasks.length,
        nainTasks: nain,
        dtmbfTasks: dtmbf
    }
}

async function fetchANFActivity(userId: string) {
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
      SUM(CASE WHEN state = 'ADDED'   AND "eventDate" BETWEEN ${todayStart} AND ${todayEnd}  THEN 1 ELSE 0 END)::int AS "addedToday",
      SUM(CASE WHEN state = 'ADDED'   AND "eventDate" BETWEEN ${weekStart}  AND ${weekEnd}   THEN 1 ELSE 0 END)::int AS "addedWeek",
      SUM(CASE WHEN state = 'ADDED'   AND "eventDate" BETWEEN ${monthStart} AND ${monthEnd}  THEN 1 ELSE 0 END)::int AS "addedMonth",
      SUM(CASE WHEN state = 'ADDED'                                    THEN 1 ELSE 0 END)::int AS "addedTotal",
      SUM(CASE WHEN state = 'REMOVED' AND "eventDate" BETWEEN ${todayStart} AND ${todayEnd}  THEN 1 ELSE 0 END)::int AS "removedToday",
      SUM(CASE WHEN state = 'REMOVED' AND "eventDate" BETWEEN ${weekStart}  AND ${weekEnd}   THEN 1 ELSE 0 END)::int AS "removedWeek",
      SUM(CASE WHEN state = 'REMOVED' AND "eventDate" BETWEEN ${monthStart} AND ${monthEnd}  THEN 1 ELSE 0 END)::int AS "removedMonth",
      SUM(CASE WHEN state = 'REMOVED'                                  THEN 1 ELSE 0 END)::int AS "removedTotal"
    FROM "ANFEvent"
    WHERE "assignedUserId" = ${userId};
  `;
  return row;
}

async function fetchCommentActivity(userId: string): Promise<CommentStats> {
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
      avgWordCount: number | null;
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
      AVG("wordCount")::float AS "avgWordCount"
    FROM "CommentEvent"
    WHERE "userId" = ${userId};
  `;
  const safeRow = row ?? {
    countToday: 0,
    countWeek: 0,
    countMonth: 0,
    countTotal: 0,
    avgWordCount: null,
  };

  return safeRow;
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
        fetchANFActivity(legacyUserId),
        fetchCommentActivity(legacyUserId),
        prisma.$queryRaw`
            SELECT
            TO_CHAR(DATE("eventDate"), 'YYYY-MM-DD') AS date,
            SUM(CASE WHEN "state" = 'ADDED'   THEN 1 ELSE 0 END)::int AS added,
            SUM(CASE WHEN "state" = 'REMOVED' THEN 1 ELSE 0 END)::int AS removed
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
            WHERE "userId" = ${legacyUserId}
            GROUP BY DATE("eventDate")
            ORDER BY DATE("eventDate")
        `,
        prisma.aNFEvent.findMany({
            orderBy: {
                eventDate: "desc",
            },
            take: 3,
        }),
        prisma.commentEvent.findMany({
            orderBy: {
                eventDate: "desc",
            },
            take: 3,
        })
    ]);

    const {nainTasks, dtmbfTasks} = taskActivity;
    const nainItems = nainTasks.map((nT, index) => {
        const nain = nT.customFields.filter(cf => cf.id === process.env.FIELD_NEXT_ATTENTION_NEEDED)[0];
        const nainDate = new Date(nain.value).toISOString().slice(0, 10);
        let status;
        const now = new Date().toISOString().slice(0, 10);
        if ((now < nainDate)) {
            status = 'upcoming';
        } else if (now === nainDate) {
            status = 'today';
        } else {
            status = 'overdue';
        }

        return {
            id: index,
            title: nT.title,
            description: `Importance: "${nT.importance}"`,
            time: `Created: ${new Date(nT.createdDate).toISOString().slice(0, 10)}`,
            date: nainDate,
            status: status
        }
    });
    
    const dtmbfItems = dtmbfTasks.map((dT, index) => {
        const dtmbf = dT.customFields.filter(cf => cf.id === process.env.FIELD_DATE_THAT_MUST_BE_FINISHED)[0];
        const dtmbfDate = new Date(dtmbf.value).toISOString().slice(0, 10);
        let status;
        const now = new Date().toISOString().slice(0, 10);
        if (dT.status !== "Completed") {
            if ((now < dtmbfDate)) {
                status = 'upcoming';
            } else if (now === dtmbfDate) {
                status = 'today';
            } else {
                status = 'overdue';
            }
        } else {
            status = "completed"
        }

        return {
            id: index,
            title: dT.title,
            description: `Importance: "${dT.importance}"`,
            time: `Created: ${new Date(dT.createdDate).toISOString().slice(0, 10)}`,
            date: dtmbfDate,
            status: status,
            link: dT.permalink
        }
    });

    const anfTaskPromises = lastANF.map(value =>
        axiosRequest<WrikeApiTasksResponse>("GET", `/tasks/${value.wrikeItemId}`)
    );

    const commentTaskPromises = lastComment.map(value =>
        axiosRequest<WrikeApiTasksResponse>("GET", `/tasks/${value.wrikeItemId}`)
    );

    const [anfTaskResponses, commentTaskResponses] = await Promise.all([
        Promise.all(anfTaskPromises),
        Promise.all(commentTaskPromises),
    ]);

    const anfActivities = lastANF.map((value, index) => {
        const taskData = anfTaskResponses[index]?.data.data[0];
        return {
            id: value.id,
            title: taskData?.title ?? "(task)",
            date: value.eventDate,
            description: `User was ${
            value.state === "ADDED" ? "added to" : "removed from"
            } the task.`,
            type: "ANF",
            link: taskData.permalink
        };
    });

    const commentActivities = lastComment.map((value, index) => {
        const taskData = commentTaskResponses[index]?.data.data[0];
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
        .map(a => ({ ...a, date: a.date.toISOString() }));

    return (
        <>
            <div className="bg-primary-foreground p-4 rounded-lg"><AppUserActivityWindow items={latest3}/></div>
            <div className="bg-primary-foreground p-4 rounded-lg lg:col-span-2 xl:col-span-1 2xl:col-span-2">
                <AppAreaChart
                    chartTitle='📍Answer is needed from'
                    chartDesc="Displays ANF historical data"
                    chartData={historicalANFData}
                    xKey="date"
                    series={[
                        { key: "removed", label: "Removed", color: "var(--chart-1)" },
                        { key: "added", label: "Added", color: "var(--chart-2)" },
                    ]}
                    xType="date" />
            </div>
            <div className="bg-primary-foreground p-4 rounded-lg ">
                <AppLineChart
                    chartTitle="User comments"
                    chartDesc="Displays historical user activity based on placed comments"
                    chartData={historicalCommentData}
                    xKey="date"
                    series={[
                        { key: "desktop", label: "Comments", color: "var(--chart-4)" },
                    ]}
                    xType='date'
                />
            </div>
            <div className="bg-primary-foreground p-4 rounded-lg lg:col-span-2 xl:col-span-1 2xl:col-span-2"><AppUserStatistics taskActivity={taskActivity} anfActivity={anfActivity} commentActivity={commentActivity}/></div>
            <div className="bg-primary-foreground p-4 rounded-lg">
                <AppCalendarView title="📍Next attention needed from assignee" items={nainItems} />
            </div>
            <div className="bg-primary-foreground p-4 rounded-lg">
                <AppCalendarView title="📍Date that must be finished" items={dtmbfItems} />
            </div>
        </>
    )
}