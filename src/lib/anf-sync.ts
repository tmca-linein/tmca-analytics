import { Prisma } from "@/generated/prisma";
import prisma from "./db";
import { chunkArray } from "./utils";
import { WrikeApiTasksResponse, WrikeTask } from "@/types/wrikeItem";
import { axiosRequest } from "./axios";
import { getUserIdMapping } from "@/cache/legacyId-cache";

export async function syncANFEvents() {
    const rows = await prisma.$queryRaw<
        {
            id: string,
            assignedUserId: string,
            wrikeItemId: string,
            state: string,
            eventDate: string,
            authorUserId: string,
            scope: string,
            rn: number
        }[]
    >(Prisma.sql`
        SELECT e.*
    FROM "ANFEvent" e
    WHERE e.state = 'ADDED'
      AND e."assignedUserId" IS NOT NULL
      AND e."wrikeItemId" IS NOT NULL
      AND NOT EXISTS (
        SELECT 1
        FROM "ANFEvent" r
        WHERE r."assignedUserId" = e."assignedUserId"
          AND r."wrikeItemId"   = e."wrikeItemId"
          AND r.state         = 'REMOVED'
      );
    `);


    const selectMap = new Map<string, {
        id: string,
        assignedUserId: string,
        wrikeItemId: string,
        state: string,
        eventDate: string,
        authorUserId: string,
        scope: string,
        rn: number
    }>();


    rows.forEach(r => selectMap.set(r.wrikeItemId, r));

    const tasksToFetch = rows.map(r => r.wrikeItemId);
    const taskChunks = chunkArray(tasksToFetch, 100);
    const taskChunkResponses = await Promise.all(
        taskChunks.map((chunk) =>
            axiosRequest<WrikeApiTasksResponse>("GET", `/tasks/${chunk.join(",")}`)
        )
    );

    const tasks: WrikeTask[] = taskChunkResponses.flatMap(r =>
        r.data.data as WrikeTask[]
    );

    const { legacyToV4 } = await getUserIdMapping();

    const t = (tasks.filter(t => {
        const anf = selectMap.get(t.id);
        const userId = legacyToV4.get(anf?.assignedUserId ?? '');
        const cf = t.customFields?.find(cf => cf.id === process.env.FIELD_ANSWER_IS_NEEDED_FROM)?.value;
        const valid = cf?.split(',').includes(userId ?? "");

        if (!valid) console.log(String(anf?.eventDate) + ' ' + anf?.wrikeItemId + " " + t.title + " " + ' ' + userId + ' ' + cf)
        return !valid;
    }));
    const filteredRows = t.map(a => selectMap.get(a.id));

    console.log(filteredRows)
    console.log(`Will delete ${(t).length} rows`);
    await prisma.$queryRaw(Prisma.sql`
        delete from "ANFEvent" e
        WHERE e.id = ANY(${filteredRows.map(a => a?.id)})
    `);

}