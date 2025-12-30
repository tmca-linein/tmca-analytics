import prisma from '@/lib/db';
import { startOfDay, startOfWeek, startOfMonth, endOfDay, endOfMonth, endOfWeek } from 'date-fns';

async function fetchANFDuration(legacyUserId: string | undefined) {
    const anfDuration = await prisma.$queryRaw<
        {
            granularity: string;
            bucket: string;
            avgduration: number;
            topfiveavgduration: number;
            transitions_count: number;
        }[]
    >`
        WITH ordered AS (
            SELECT
                "assignedUserId",
                "wrikeItemId",
                state,
                "eventDate",
                LEAD(state) OVER (
                PARTITION BY "assignedUserId", "wrikeItemId"
                ORDER BY "eventDate"
                ) AS next_state,
                LEAD("eventDate") OVER (
                PARTITION BY "assignedUserId", "wrikeItemId"
                ORDER BY "eventDate"
                ) AS next_date
            FROM "ANFEvent"
            WHERE "assignedUserId" = ${legacyUserId}
        ),
        pairs AS (
            SELECT
                "eventDate" AS added_at,
                (EXTRACT(EPOCH FROM ("next_date" - "eventDate")) / 3600.0)::float8 AS duration
            FROM ordered
            WHERE state = 'ADDED' AND next_state = 'REMOVED'
        ),
        agg AS (
            SELECT 'week'    AS granularity, date_trunc('week',    added_at) AS bucket, duration FROM pairs
            UNION ALL
            SELECT 'month'   AS granularity, date_trunc('month',   added_at) AS bucket, duration FROM pairs
            UNION ALL
            SELECT 'quarter' AS granularity, date_trunc('quarter', added_at) AS bucket, duration FROM pairs
        ),
        ranked AS (
            SELECT
                granularity,
                bucket,
                duration,
                ROW_NUMBER() OVER (
                PARTITION BY granularity, bucket
                ORDER BY duration DESC
                ) AS rn
            FROM agg
        )
        SELECT
            granularity,
            bucket,
            ROUND(AVG(duration)::numeric, 1)::float8 AS avgduration,
            ROUND(AVG(duration) FILTER (WHERE rn <= 5)::numeric, 1)::float8 AS topfiveavgduration,
            COUNT(*) AS transitions_count
        FROM ranked
        GROUP BY granularity, bucket
        ORDER BY granularity, bucket;
    `;
    return anfDuration;
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

export async function fetchBulkANFActivity() {
    const now = new Date();
    const todayStart = startOfDay(now);
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const monthStart = startOfMonth(now);
    const todayEnd = endOfDay(now);
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const monthEnd = endOfMonth(now);
    const rows = await prisma.$queryRaw<{
        assignedUserId: string;
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
            "assignedUserId",
            SUM(
                CASE
                WHEN state = 'ADDED'
                AND "authorUserId" <> "assignedUserId"
                AND "eventDate" BETWEEN ${todayStart} AND ${todayEnd}
                THEN 1 ELSE 0
                END
            )::int AS "addedToday",
            SUM(
                CASE
                WHEN state = 'ADDED'
                AND "authorUserId" <> "assignedUserId"
                AND "eventDate" BETWEEN ${weekStart} AND ${weekEnd}
                THEN 1 ELSE 0
                END
            )::int AS "addedWeek",
            SUM(
                CASE
                WHEN state = 'ADDED'
                AND "authorUserId" <> "assignedUserId"
                AND "eventDate" BETWEEN ${monthStart} AND ${monthEnd}
                THEN 1 ELSE 0
                END
            )::int AS "addedMonth",
            SUM(
                CASE
                WHEN state = 'ADDED'
                AND "authorUserId" <> "assignedUserId"
                THEN 1 ELSE 0
                END
            )::int AS "addedTotal",
            SUM(
                CASE
                WHEN state = 'REMOVED'
                AND "eventDate" BETWEEN ${todayStart} AND ${todayEnd}
                AND EXISTS (
                    SELECT 1
                    FROM "CommentEvent" ce
                    WHERE ce."wrikeItemId" = "ANFEvent"."wrikeItemId"
                    AND ce."userId" = "ANFEvent"."authorUserId"
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
                AND "eventDate" BETWEEN ${weekStart} AND ${weekEnd}
                AND EXISTS (
                    SELECT 1
                    FROM "CommentEvent" ce
                    WHERE ce."wrikeItemId" = "ANFEvent"."wrikeItemId"
                    AND ce."userId" = "ANFEvent"."authorUserId"
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
                AND "eventDate" BETWEEN ${monthStart} AND ${monthEnd}
                AND EXISTS (
                    SELECT 1
                    FROM "CommentEvent" ce
                    WHERE ce."wrikeItemId" = "ANFEvent"."wrikeItemId"
                    AND ce."userId" = "ANFEvent"."authorUserId"
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
                AND EXISTS (
                    SELECT 1
                    FROM "CommentEvent" ce
                    WHERE ce."wrikeItemId" = "ANFEvent"."wrikeItemId"
                    AND ce."userId" = "ANFEvent"."authorUserId"
                    AND ce."eventDate" BETWEEN
                        "ANFEvent"."eventDate" - INTERVAL '10 minutes'
                        AND "ANFEvent"."eventDate" + INTERVAL '10 minutes'
                )
                THEN 1 ELSE 0
                END
            )::int AS "removedTotal"

        FROM "ANFEvent"
        GROUP BY "assignedUserId"
    `;

    return rows;
}

async function fetchHistoricalANFData(userId: string | undefined, legacyUserId: string | undefined) {
    return await prisma.$queryRaw`
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
    `;
}


export async function fetchTopTenLongestActiveANFDurations(legacyUserId: string | undefined) {
    const anfEvents = await prisma.$queryRaw<{
        id: string,
        wrikeItemId: string,
        added_at: Date,
        duration_hours: number
    }[]>`
        WITH ordered AS (
            SELECT
                "id",
                "wrikeItemId",
                state,
                "eventDate",
                LEAD(state) OVER (
                    PARTITION BY "assignedUserId", "wrikeItemId"
                    ORDER BY "eventDate"
                ) AS next_state,
                LEAD("eventDate") OVER (
                    PARTITION BY "assignedUserId", "wrikeItemId"
                    ORDER BY "eventDate"
                ) AS next_date
            FROM "ANFEvent"
            WHERE "assignedUserId" = ${legacyUserId}
        ),
        active AS (
            SELECT
                "id",
                "wrikeItemId",
                "eventDate" AS added_at,
                (EXTRACT(EPOCH FROM (NOW() - "eventDate")) / 3600.0)::float8 AS duration_hours
            FROM ordered
            WHERE state = 'ADDED'
                AND next_state IS NULL
        )
        SELECT
            "id",
            "wrikeItemId",
            added_at,
            ROUND(duration_hours::numeric, 1)::float8 AS duration_hours
        FROM active
        ORDER BY duration_hours DESC
        LIMIT 10;
    `;

    return anfEvents;
}

export async function fetchANFData(userId: string | undefined, legacyUserId: string | undefined) {
    const [
        anfDuration,
        anfActivity,
        historicalANFData,
    ] = await Promise.all([
        fetchANFDuration(legacyUserId),
        fetchANFActivity(userId, legacyUserId),
        fetchHistoricalANFData(userId, legacyUserId)
    ]);

    return {
        anfDuration,
        anfActivity,
        historicalANFData,
    };
}