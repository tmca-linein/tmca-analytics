import { Prisma } from "@/generated/prisma";
import prisma from "@/lib/db";
import { BulkSpaceItemCommentActivity, BulkUserCommentActivity, SpaceItemCommentActivity, UserCommentActivity } from "@/types/stats";
import { endOfDay, endOfMonth, endOfWeek, startOfDay, startOfMonth, startOfWeek } from "date-fns";

function getCommentWindows(now = new Date()) {
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    return { todayStart, todayEnd, weekStart, weekEnd, monthStart, monthEnd };
}

function commentAggSelect(w: ReturnType<typeof getCommentWindows>) {
    const { todayStart, todayEnd, weekStart, weekEnd, monthStart, monthEnd } = w;

    return Prisma.sql`
    SUM(CASE WHEN "eventDate" BETWEEN ${todayStart} AND ${todayEnd} THEN 1 ELSE 0 END)::int AS "countToday",
    SUM(CASE WHEN "eventDate" BETWEEN ${weekStart}  AND ${weekEnd}  THEN 1 ELSE 0 END)::int AS "countWeek",
    SUM(CASE WHEN "eventDate" BETWEEN ${monthStart} AND ${monthEnd} THEN 1 ELSE 0 END)::int AS "countMonth",
    COUNT(*)::int                                                                           AS "countTotal", 

    AVG(CASE WHEN "eventDate" BETWEEN ${todayStart} AND ${todayEnd} THEN "wordCount" END)::float AS "avgWordCountToday",
    AVG(CASE WHEN "eventDate" BETWEEN ${weekStart}  AND ${weekEnd}  THEN "wordCount" END)::float AS "avgWordCountWeek",
    AVG(CASE WHEN "eventDate" BETWEEN ${monthStart} AND ${monthEnd} THEN "wordCount" END)::float AS "avgWordCountMonth"
  `;
}

// User view
export async function fetchUserCommentActivity(userId: string) {
    const w = getCommentWindows();

    const rows = await prisma.$queryRaw<
        UserCommentActivity[]
    >(Prisma.sql`
    WITH events AS (
      SELECT
        e."eventDate",
        e."wordCount"
      FROM "CommentEvent" e
      WHERE "userId" = ${userId}
    )
    SELECT
      ${commentAggSelect(w)}
    FROM events
  `);

    return rows[0];
}

// Users table
export async function fetchBulkUserCommentActivity() {
    const w = getCommentWindows();

    const rows = await prisma.$queryRaw<
        BulkUserCommentActivity[]
    >(Prisma.sql`
    WITH events AS (
      SELECT
        e."userId",
        e."eventDate",
        e."wordCount"
      FROM "CommentEvent" e
    )
    SELECT
      "userId",
      ${commentAggSelect(w)}
    FROM events
    GROUP BY "userId";
  `);

    return rows;
}

// SpaceItem view
export async function fetchSpaceItemCommentActivity(itemIds: string[]) {
    const w = getCommentWindows();

    const [row] = await prisma.$queryRaw<
        SpaceItemCommentActivity[]
    >(Prisma.sql`
    WITH events AS (
      SELECT
        e."eventDate",
        e."wordCount"
      FROM "CommentEvent" e
      WHERE "wrikeItemId" = ANY(${itemIds})
    )
    SELECT
      ${commentAggSelect(w)}
    FROM events
  `);

    return row;
}

// SpaceItem table
export async function fetchBulkSpaceItemCommentActivity(rootsJson: string) {
    const w = getCommentWindows();

    const rows = await prisma.$queryRaw<BulkSpaceItemCommentActivity[]>(
        Prisma.sql`
    WITH roots AS (
      SELECT *
      FROM jsonb_to_recordset(${rootsJson}::jsonb)
        AS r("root_id" text, "wrikeItemIds" jsonb)
    ),
    input AS (
      SELECT
        r."root_id",
        jsonb_array_elements_text(r."wrikeItemIds") AS "wrikeItemId"
      FROM roots r
    ),
    events AS (
      SELECT
        i."root_id",
        e."eventDate",
        e."wordCount"
      FROM input i
      JOIN "CommentEvent" e
        ON e."wrikeItemId" = i."wrikeItemId"
    )
    SELECT
      "root_id",
      ${commentAggSelect(w)}
    FROM events
    GROUP BY "root_id"
    ORDER BY "root_id";
  `);

    return rows;
}

// SpaceItem view - user table
export async function fetchSpaceItemBulkUserCommentActivity(itemIds: string[]) {
    const w = getCommentWindows();

    const rows = await prisma.$queryRaw<
        BulkUserCommentActivity[]
    >(Prisma.sql`
    WITH events AS (
      SELECT
        e."userId",
        e."eventDate",
        e."wordCount"
      FROM "CommentEvent" e
      WHERE "wrikeItemId" = ANY(${itemIds})
    )
    SELECT
      ${commentAggSelect(w)}
    FROM events
    GROUP BY "userId"
    ORDER BY "userId";
  `);

    return rows;
}

export async function fetchHistoricalCommentData(userId: string | null, itemIds: string[]) {
    const userFilter = userId
        ? Prisma.sql`AND "userId" = ${userId}`
        : Prisma.empty;

    const itemsFilter =
        itemIds && itemIds.length > 0
            ? Prisma.sql`AND "wrikeItemId" = ANY(${Prisma.sql`${itemIds}::text[]`})`
            : Prisma.empty;
    return await prisma.$queryRaw(
        Prisma.sql`
            SELECT
                TO_CHAR(DATE("eventDate"), 'YYYY-MM-DD') AS date,
                COUNT(*)::int AS comments
            FROM "CommentEvent"
            WHERE  1=1
            ${userFilter}
            ${itemsFilter}
            GROUP BY DATE("eventDate")
            ORDER BY DATE("eventDate")
        `
    );
}