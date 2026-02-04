import prisma from "@/lib/db";
import { isoTomorrowAtUTC } from "@/lib/utils";
import { DisplayItemMetrics, DisplayItemUserMetrics } from "@/types/stats";

const spaceItemMetricCache = new Map<string, DisplayItemMetrics>();
let NEXT_UPDATE_DATE: string;
export let folderCacheExpires: number;
let inflight: Promise<void> | undefined;

async function fetchMetrics(): Promise<void> {
    if (inflight) return inflight;
    inflight = (async (): Promise<void> => {
        try {
            const todayUtc = new Date().toISOString().slice(0, 10);
            const allMetrics = await prisma.$queryRaw<DisplayItemMetrics[]>`
                SELECT * FROM "WrikeItemMetricsTable"
                WHERE day = ${todayUtc}::date;
            `;
            allMetrics.forEach(e => {
                if (!e.wrikeItemId) return;
                spaceItemMetricCache.set(e.wrikeItemId, e);
            });
        } catch {
            return;
        } finally {
            inflight = undefined;
        }
    })();

    return inflight;
}

export async function getSpaceItemMetrics(itemId: string): Promise<DisplayItemMetrics | null> {
    const metricCacheExpired = NEXT_UPDATE_DATE ? new Date().toISOString() > NEXT_UPDATE_DATE : true;
    if (metricCacheExpired) {
        spaceItemMetricCache.clear();
        await fetchMetrics();
        NEXT_UPDATE_DATE = isoTomorrowAtUTC();
    }

    const metrics = spaceItemMetricCache.get(itemId) ?? null;
    return metrics;
}


export async function getSpaceItemHistoricalMetrics(itemId: string) {
    const metrics = await prisma.$queryRaw<DisplayItemMetrics[]>`
                SELECT * FROM "WrikeItemMetricsTable"
                WHERE "wrikeItemId" = ${itemId}::text;
            `;

    return metrics;
}

export async function getSpaceItemUserMetrics(itemId: string) {
    const todayUtc = new Date().toISOString().slice(0, 10);
    const metrics = await prisma.$queryRaw<DisplayItemUserMetrics[]>`
                SELECT * FROM "WrikeItemUserMetricsTable"
                WHERE "wrikeItemId" = ${itemId}::text
                AND day = ${todayUtc}::date;
            `;

    return metrics;
}