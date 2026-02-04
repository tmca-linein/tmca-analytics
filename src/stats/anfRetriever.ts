import { Prisma } from '@/generated/prisma';
import prisma from '@/lib/db';
import { startOfLastMonthUTC } from '@/lib/utils';
import {
  ANFDuration,
  BulkSpaceItemANFActivity,
  BulkUserANFActivity,
  SpaceItemANFActivity,
  UserANFActivity,
  ANFLongDurationItem
} from '@/types/stats';
import {
  startOfDay,
  startOfWeek,
  startOfMonth,
  endOfDay,
  endOfMonth,
  endOfWeek,
} from 'date-fns';


function getAnfWindows(now = new Date()) {
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const lastMonthStart = startOfLastMonthUTC(now);
  const lastMonthEnd = startOfMonth(now);

  return { todayStart, todayEnd, weekStart, weekEnd, monthStart, monthEnd, lastMonthStart, lastMonthEnd };
}

function anfAggSelect(w: ReturnType<typeof getAnfWindows>) {
  const { todayStart, todayEnd, weekStart, weekEnd, monthStart, monthEnd, lastMonthStart, lastMonthEnd } = w;

  return Prisma.sql`
    SUM(CASE WHEN state = 'ADDED'   AND "eventDate" BETWEEN ${todayStart} AND ${todayEnd} THEN 1 ELSE 0 END)::int AS "addedDay",
    SUM(CASE WHEN state = 'ADDED'   AND "eventDate" BETWEEN ${weekStart}  AND ${weekEnd}  THEN 1 ELSE 0 END)::int AS "addedWeek",
    SUM(CASE WHEN state = 'ADDED'   AND "eventDate" BETWEEN ${monthStart} AND ${monthEnd} THEN 1 ELSE 0 END)::int AS "addedMonth",
    SUM(CASE WHEN state = 'ADDED'   AND "eventDate" BETWEEN ${lastMonthStart} AND ${lastMonthEnd} THEN 1 ELSE 0 END)::int AS "addedLastMonth",

    SUM(CASE WHEN state = 'REMOVED' AND "eventDate" BETWEEN ${todayStart} AND ${todayEnd} AND is_valid_removed THEN 1 ELSE 0 END)::int AS "removedDay",
    SUM(CASE WHEN state = 'REMOVED' AND "eventDate" BETWEEN ${weekStart}  AND ${weekEnd}  AND is_valid_removed THEN 1 ELSE 0 END)::int AS "removedWeek",
    SUM(CASE WHEN state = 'REMOVED' AND "eventDate" BETWEEN ${monthStart} AND ${monthEnd} AND is_valid_removed THEN 1 ELSE 0 END)::int AS "removedMonth",
    SUM(CASE WHEN state = 'REMOVED' AND "eventDate" BETWEEN ${lastMonthStart} AND ${lastMonthEnd} AND is_valid_removed THEN 1 ELSE 0 END)::int AS "removedLastMonth"
  `;
}

// Users table view
export async function fetchBulkUserANFActivity() {
  const w = getAnfWindows();

  const rows = await prisma.$queryRaw<
    BulkUserANFActivity[]
  >(Prisma.sql`
    WITH events AS (
      SELECT
        e."assignedUserId",
        e.state,
        e."eventDate",
        e."wrikeItemId",
        e."authorUserId"
      FROM "ANFEvent" e
    ),
    flagged AS (
      SELECT
        *,
        EXISTS (
          SELECT 1
          FROM "CommentEvent" ce
          WHERE ce."wrikeItemId" = events."wrikeItemId"
            AND ce."userId" = events."authorUserId"
            AND ce."eventDate" BETWEEN events."eventDate" - INTERVAL '10 minutes'
                                  AND events."eventDate" + INTERVAL '10 minutes'
        ) AS is_valid_removed
      FROM events
    )
    SELECT
      "assignedUserId",
      ${anfAggSelect(w)}
    FROM flagged
    GROUP BY "assignedUserId"
    ORDER BY "assignedUserId";
  `);

  return rows;
}


// SpaceItem table view
export async function fetchBulkSpaceItemANFActivity(rootsJson: string) {
  const w = getAnfWindows();

  const rows = await prisma.$queryRaw<BulkSpaceItemANFActivity[]>(
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
        e."assignedUserId",
        e.state,
        e."eventDate",
        e."wrikeItemId",
        e."authorUserId"
      FROM input i
      JOIN "ANFEvent" e
        ON e."wrikeItemId" = i."wrikeItemId"
    ),
    flagged AS (
      SELECT
        *,
        EXISTS (
          SELECT 1
          FROM "CommentEvent" ce
          WHERE ce."wrikeItemId" = events."wrikeItemId"
            AND ce."userId" = events."authorUserId"
            AND ce."eventDate" BETWEEN events."eventDate" - INTERVAL '10 minutes'
                                  AND events."eventDate" + INTERVAL '10 minutes'
        ) AS is_valid_removed
      FROM events
    )
    SELECT
      "root_id",
      ${anfAggSelect(w)}
    FROM flagged
    GROUP BY "root_id"
    ORDER BY "root_id";
  `);

  return rows;
}

// User view
export async function fetchUserANFActivity(legacyUserId: string) {
  const w = getAnfWindows();

  const rows = await prisma.$queryRaw<
    UserANFActivity[]
  >(Prisma.sql`
    WITH events AS (
      SELECT
        e.state,
        e."eventDate",
        e."wrikeItemId",
        e."authorUserId"
      FROM "ANFEvent" e
      WHERE "assignedUserId" = ${legacyUserId}
    ),
    flagged AS (
      SELECT
        *,
        EXISTS (
          SELECT 1
          FROM "CommentEvent" ce
          WHERE ce."wrikeItemId" = events."wrikeItemId"
            AND ce."userId" = events."authorUserId"
            AND ce."eventDate" BETWEEN events."eventDate" - INTERVAL '10 minutes'
                                  AND events."eventDate" + INTERVAL '10 minutes'
        ) AS is_valid_removed
      FROM events
    )
    SELECT
      ${anfAggSelect(w)}
    FROM flagged
  `);

  return rows[0];
}

// SpaceItem view - accumulated
export async function fetchSpaceItemANFActivity(itemIds: string[]) {
  const w = getAnfWindows();

  const rows = await prisma.$queryRaw<
    SpaceItemANFActivity[]
  >(Prisma.sql`
    WITH events AS (
      SELECT
        e.state,
        e."eventDate",
        e."wrikeItemId",
        e."authorUserId"
      FROM "ANFEvent" e
      WHERE "wrikeItemId" = ANY(${itemIds})
    ),
    flagged AS (
      SELECT
        *,
        EXISTS (
          SELECT 1
          FROM "CommentEvent" ce
          WHERE ce."wrikeItemId" = events."wrikeItemId"
            AND ce."userId" = events."authorUserId"
            AND ce."eventDate" BETWEEN events."eventDate" - INTERVAL '10 minutes'
                                  AND events."eventDate" + INTERVAL '10 minutes'
        ) AS is_valid_removed
      FROM events
    )
    SELECT
      ${anfAggSelect(w)}
    FROM flagged
  `);

  return rows[0];
}

// SpaceItem view - user table
export async function fetchSpaceItemBulkUserANFActivity(itemIds: string[]) {
  const w = getAnfWindows();

  const rows = await prisma.$queryRaw<
    BulkUserANFActivity[]
  >(Prisma.sql`
    WITH events AS (
      SELECT
        e."assignedUserId",
        e.state,
        e."eventDate",
        e."wrikeItemId",
        e."authorUserId"
      FROM "ANFEvent" e
      WHERE "wrikeItemId" = ANY(${itemIds})
    ),
    flagged AS (
      SELECT
        *,
        EXISTS (
          SELECT 1
          FROM "CommentEvent" ce
          WHERE ce."wrikeItemId" = events."wrikeItemId"
            AND ce."userId" = events."authorUserId"
            AND ce."eventDate" BETWEEN events."eventDate" - INTERVAL '10 minutes'
                                  AND events."eventDate" + INTERVAL '10 minutes'
        ) AS is_valid_removed
      FROM events
    )
    SELECT
      "assignedUserId",
      ${anfAggSelect(w)}
    FROM flagged
    GROUP BY "assignedUserId"
    ORDER BY "assignedUserId";
  `);

  return rows;
}


// ===== ANF DURATION =====

const anfDurationCore = Prisma.sql`
  ,pairs AS (
    SELECT
      *
    FROM (
      SELECT
        o.*,
        (EXTRACT(EPOCH FROM (o.next_date - o."eventDate")) / 3600.0)::float8 AS duration
      FROM ordered o
      WHERE o.state = 'ADDED'
        AND o.next_state = 'REMOVED'
        AND o.next_date IS NOT NULL
        AND o.next_authorUserId IS NOT NULL
        AND EXISTS (
          SELECT 1
          FROM "CommentEvent" ce
          WHERE ce."wrikeItemId" = o."wrikeItemId"
            AND ce."userId" = o.next_authorUserId
            AND ce."eventDate" BETWEEN
              o.next_date - INTERVAL '10 minutes'
              AND o.next_date + INTERVAL '10 minutes'
        )
    ) p
  ),
  agg AS (
    SELECT 'week'    AS granularity, date_trunc('week',    next_date) AS bucket, duration, "assignedUserId", root_id
    FROM pairs
    UNION ALL
    SELECT 'month'   AS granularity, date_trunc('month',   next_date) AS bucket, duration, "assignedUserId", root_id
    FROM pairs
  ),
  ranked AS (
    SELECT
      granularity,
      bucket,
      "assignedUserId",
      root_id,
      duration,
      ROW_NUMBER() OVER (
        PARTITION BY granularity, bucket, "assignedUserId", root_id
        ORDER BY duration DESC
      ) AS rn
    FROM agg
  )
`;

// Single user ANF durations
export async function fetchUserANFDuration(legacyUserId: string) {
  if (!legacyUserId) return [];

  const rows = await prisma.$queryRaw<
    ANFDuration[]
  >(Prisma.sql`
    WITH ordered AS (
      SELECT
        "assignedUserId",
        NULL::text AS root_id,
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
        ) AS next_date,
        LEAD("authorUserId") OVER (
          PARTITION BY "assignedUserId", "wrikeItemId"
          ORDER BY "eventDate"
        ) AS next_authorUserId
      FROM "ANFEvent"
      WHERE "assignedUserId" = ${legacyUserId}
    )
    ${anfDurationCore}
    SELECT
        granularity,
        bucket::text AS bucket,
        ROUND(AVG(duration)::numeric, 1)::float8 AS avgduration,
        ROUND(AVG(duration) FILTER (WHERE rn <= 5)::numeric, 1)::float8 AS topfiveavgduration,
        COUNT(*) AS transitions_count,
        COUNT(*) FILTER (WHERE duration > 24.0) AS overdue_count,
        ROUND(AVG(duration-24.0) FILTER (WHERE duration > 24.0)::numeric, 1)::float8 AS avgoverduehours
    FROM ranked
    GROUP BY granularity, bucket
    ORDER BY granularity, bucket
  `);

  return rows;
}

// Users table ANF duration
export async function fetchBulkUserANFDuration() {
  const rows = await prisma.$queryRaw<ANFDuration[]>(
    Prisma.sql`
      WITH ordered AS (
        SELECT
          "assignedUserId",
          NULL::text AS root_id,
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
          ) AS next_date,
          LEAD("authorUserId") OVER (
            PARTITION BY "assignedUserId", "wrikeItemId"
            ORDER BY "eventDate"
          ) AS next_authorUserId
        FROM "ANFEvent"
      )
      ${anfDurationCore}
      SELECT
            "assignedUserId",
            granularity,
            bucket::text AS bucket,
            ROUND(AVG(duration)::numeric, 1)::float8 AS avgduration,
            ROUND(AVG(duration) FILTER (WHERE rn <= 5)::numeric, 1)::float8 AS topfiveavgduration,
            COUNT(*) AS transitions_count,
            COUNT(*) FILTER (WHERE duration > 24.0) AS overdue_count,
            ROUND(AVG(duration-24.0) FILTER (WHERE duration > 24.0)::numeric, 1)::float8 AS avgoverduehours
      FROM ranked
      GROUP BY granularity, bucket, "assignedUserId"
      ORDER BY granularity, bucket, "assignedUserId"
    `
  );

  return rows;
}

// SpaceItem table ANF duration
export async function fetchBulkSpaceItemANFDuration(rootsJson: string) {
  const rows = await prisma.$queryRaw<
    ANFDuration[]
  >(Prisma.sql`
    WITH roots AS (
      SELECT *
      FROM jsonb_to_recordset(${rootsJson}::jsonb)
        AS r("root_id" text, "wrikeItemIds" jsonb)
    ),
    input AS (
      SELECT
        r."root_id",
        x.value::text AS "wrikeItemId"
      FROM roots r
      CROSS JOIN LATERAL jsonb_array_elements_text(r."wrikeItemIds") AS x(value)
    ),
    ordered AS (
      SELECT
        i."root_id",
        e."assignedUserId",
        e."wrikeItemId",
        e.state,
        e."eventDate",
        LEAD(e.state) OVER (
          PARTITION BY i."root_id", e."assignedUserId", e."wrikeItemId"
          ORDER BY e."eventDate"
        ) AS next_state,
        LEAD(e."eventDate") OVER (
          PARTITION BY i."root_id", e."assignedUserId", e."wrikeItemId"
          ORDER BY e."eventDate"
        ) AS next_date,
        LEAD(e."authorUserId") OVER (
          PARTITION BY i."root_id", e."assignedUserId", e."wrikeItemId"
          ORDER BY e."eventDate"
        ) AS next_authorUserId
      FROM input i
      JOIN "ANFEvent" e
        ON e."wrikeItemId" = i."wrikeItemId"
    )
    ${anfDurationCore}
    SELECT
        "root_id",
        granularity,
        bucket::text AS bucket,
        ROUND(AVG(duration)::numeric, 1)::float8 AS avgduration,
        ROUND(AVG(duration) FILTER (WHERE rn <= 5)::numeric, 1)::float8 AS topfiveavgduration,
        COUNT(*) AS transitions_count,
        COUNT(*) FILTER (WHERE duration > 24.0) AS overdue_count,
        ROUND(AVG(duration-24.0) FILTER (WHERE duration > 24.0)::numeric, 1)::float8 AS avgoverduehours
      FROM ranked
      GROUP BY granularity, bucket, "root_id"
      ORDER BY granularity, bucket, "root_id"
  `);

  return rows;
}

// SpaceItem view - accumulated
export async function fetchSpaceItemANFDuration(itemIds: string[]) {
  const rows = await prisma.$queryRaw<
    ANFDuration[]
  >(Prisma.sql`
    WITH ordered AS (
      SELECT
        "assignedUserId",
          NULL::text AS root_id,
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
          ) AS next_date,
          LEAD("authorUserId") OVER (
            PARTITION BY "assignedUserId", "wrikeItemId"
            ORDER BY "eventDate"
          ) AS next_authorUserId
        FROM "ANFEvent"
      WHERE "wrikeItemId" = ANY(${itemIds})
    )
    ${anfDurationCore}
  SELECT
    granularity,
    bucket::text AS bucket,
    ROUND(AVG(duration)::numeric, 1)::float8 AS avgduration,
    ROUND(AVG(duration) FILTER (WHERE rn <= 5)::numeric, 1)::float8 AS topfiveavgduration,
    COUNT(*) AS transitions_count,
    COUNT(*) FILTER (WHERE duration > 24.0) AS overdue_count,
    ROUND(AVG(duration-24.0) FILTER (WHERE duration > 24.0)::numeric, 1)::float8 AS avgoverduehours
  FROM ranked
  GROUP BY granularity, bucket
  ORDER BY granularity, bucket
  `);

  return rows;
}

// SpaceItem view - users table ANF duration
export async function fetchSpaceItemBulkUserANFDuration(itemIds: string[]) {
  const rows = await prisma.$queryRaw<ANFDuration[]>(
    Prisma.sql`
      WITH ordered AS (
        SELECT
          "assignedUserId",
          NULL::text AS root_id,
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
          ) AS next_date,
          LEAD("authorUserId") OVER (
            PARTITION BY "assignedUserId", "wrikeItemId"
            ORDER BY "eventDate"
          ) AS next_authorUserId
        FROM "ANFEvent"
        WHERE "wrikeItemId" = ANY(${itemIds})
      )
      ${anfDurationCore}
      SELECT
        "assignedUserId",
        granularity,
        bucket::text AS bucket,
        ROUND(AVG(duration)::numeric, 1)::float8 AS avgduration,
        ROUND(AVG(duration) FILTER (WHERE rn <= 5)::numeric, 1)::float8 AS topfiveavgduration,
        COUNT(*) AS transitions_count,
        COUNT(*) FILTER (WHERE duration > 24.0) AS overdue_count,
        ROUND(AVG(duration-24.0) FILTER (WHERE duration > 24.0)::numeric, 1)::float8 AS avgoverduehours
      FROM ranked
      GROUP BY granularity, bucket, "assignedUserId"
      ORDER BY granularity, bucket, "assignedUserId"
    `
  );

  return rows;
}

export async function fetchHistoricalANFData(legacyUserId: string | null, itemIds: string[]) {
  const userFilter = legacyUserId
    ? Prisma.sql`AND e."assignedUserId" = ${legacyUserId}`
    : Prisma.empty;

  const itemsFilter =
    itemIds && itemIds.length > 0
      ? Prisma.sql`AND e."wrikeItemId" = ANY(${Prisma.sql`${itemIds}::text[]`})`
      : Prisma.empty;

  return prisma.$queryRaw(
    Prisma.sql`
            SELECT
                TO_CHAR(DATE(e."eventDate"), 'YYYY-MM-DD') AS date,
                SUM(CASE WHEN e.state = 'ADDED' THEN 1 ELSE 0 END)::int AS added,
                SUM(
                    CASE
                    WHEN e.state = 'REMOVED'
                    AND EXISTS (
                        SELECT 1
                        FROM "CommentEvent" ce
                        WHERE ce."wrikeItemId" = e."wrikeItemId"
                        AND ce."userId" = e."authorUserId"
                        AND ce."eventDate" BETWEEN
                            e."eventDate" - INTERVAL '10 minutes'
                            AND e."eventDate" + INTERVAL '10 minutes'
                    )
                    THEN 1 ELSE 0
                    END
                )::int AS removed
            FROM "ANFEvent" e
            WHERE 1=1
                ${userFilter}
                ${itemsFilter}
            GROUP BY DATE(e."eventDate")
            ORDER BY DATE(e."eventDate");
        `
  );

}

export async function fetchTopLongestActiveANFDurations(
  legacyUserId: string | null,
  itemIds: string[],
  limit: number = 10): Promise<ANFLongDurationItem[]> {
  const userFilter = legacyUserId ? Prisma.sql`AND "assignedUserId" = ${legacyUserId}` : Prisma.empty;
  const itemsFilter = itemIds && itemIds.length > 0
    ? Prisma.sql`AND "wrikeItemId" = ANY(${itemIds}::text[])`
    : Prisma.empty;

  const rows = await prisma.$queryRaw<ANFLongDurationItem[]>(Prisma.sql`
    WITH ordered AS (
      SELECT
        "id",
        "wrikeItemId",
        state,
        scope,
        "eventDate",
        "assignedUserId",
        LEAD(state) OVER (
          PARTITION BY "assignedUserId", "wrikeItemId"
          ORDER BY "eventDate"
        ) AS next_state,
        LEAD("eventDate") OVER (
          PARTITION BY "assignedUserId", "wrikeItemId"
          ORDER BY "eventDate"
        ) AS next_date
      FROM "ANFEvent"
      WHERE 1=1
      ${userFilter}
      ${itemsFilter}
    ),
    active AS (
      SELECT
        "id",
        "wrikeItemId",
        scope,
        "assignedUserId",
        "eventDate" AS added_at,
        (EXTRACT(EPOCH FROM (NOW() - "eventDate")) / 3600.0)::float8 AS duration_hours
      FROM ordered
      WHERE state = 'ADDED'
        AND next_state IS NULL
    )
    SELECT
      "id",
      "wrikeItemId",
      "scope",
      "assignedUserId",
      added_at,
      ROUND(duration_hours::numeric, 1)::float8 AS duration_hours
    FROM active
    ORDER BY duration_hours DESC
    LIMIT ${Prisma.sql`${limit}`}
  `);

  return rows;
}