import prisma from "@/lib/db";
import { endOfDay, endOfMonth, endOfWeek, startOfDay, startOfMonth, startOfWeek } from "date-fns";

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
        CommentStats[]
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

export async function fetchBulkCommentActivity(): Promise<(CommentStats & { userId: string })[]> {
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const rows = await prisma.$queryRaw<
        (CommentStats & { userId: string })[]
    >`
    SELECT
      "userId",
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
    GROUP BY "userId";
  `;

    return rows;
}

async function fetchHistoricalCommentData(userId: string | undefined) {
    return await prisma.$queryRaw`
        SELECT
            TO_CHAR(DATE("eventDate"), 'YYYY-MM-DD') AS date,
            COUNT(*)::int AS comments
        FROM "CommentEvent"
        WHERE "userId" = ${userId}
        GROUP BY DATE("eventDate")
        ORDER BY DATE("eventDate")
    `;
}

export async function fetchCommentStats(userId: string | undefined) {
    return {
        commentActivity: await fetchCommentActivity(userId),
        historicalCommentData: await fetchHistoricalCommentData(userId)
    }
}