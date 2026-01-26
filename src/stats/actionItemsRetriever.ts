import { axiosRequest } from "@/lib/axios";
import { WrikeApiTasksResponse, WrikeTask } from "@/types/wrikeItem";
import { ActionItem } from "@/components/AppActionItems";
import { fetchTopLongestActiveANFDurations } from "./anfRetriever";
import { ANFLongDurationItem } from "@/types/stats";
import { chunkArray } from "@/lib/utils";
import { getTasksForSession } from "@/cache/wrikeItem-cache";

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

async function buildANFActionItemList(anfEvents: ANFLongDurationItem[]) {
    const tasksToFetch = anfEvents.map(ae => ae.wrikeItemId);
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
    const anfActionItems = await Promise.all(
        anfEvents.map(async (value) => {
            const task = taskById.get(value.wrikeItemId);
            const taskData = task
                ? task
                : { title: "***Task not found or not authorised***", permalink: "#" };

            return {
                id: value.id,
                title: taskData.title,
                link: taskData.permalink,
                type: "ANF",
                description: "📍 Answer is needed within 24h!",
                actionNeededFromDate: value.added_at.toISOString(),
                actionNeededUntilDate: new Date(value.added_at.getTime() + 24 * 60 * 60 * 1000).toISOString(),
                overdueDuration: Math.max(value.duration_hours - 24, 0),
            } satisfies ActionItem;
        }));

    return anfActionItems;
}

async function fetchUserANFActionItems(legacyUserId: string | undefined) {
    const anfEvents = await fetchTopLongestActiveANFDurations(legacyUserId ?? '', [], 10);
    return buildANFActionItemList(anfEvents);
}

async function fetchSpaceItemANFActionItems(taskIds: string[]) {
    const anfEvents = await fetchTopLongestActiveANFDurations(null, taskIds, 10);
    return buildANFActionItemList(anfEvents)
}

async function buildDateTypeActionItems(tasks: WrikeTask[]) {
    // next attention is needed:
    const nainTasks = tasks.filter(at => at.status === "Active" && at.customFields?.some(cf => cf.id === process.env.FIELD_NEXT_ATTENTION_NEEDED && cf.value !== null && cf.value !== ""))
    // date that must be finished:
    const dtmbfTasks = tasks.filter(at => at.status === "Active" && at.customFields?.some(cf => cf.id === process.env.FIELD_DATE_THAT_MUST_BE_FINISHED && cf.value !== null && cf.value !== ""))

    const nainAI = (nainTasks as WrikeTask[]).map(nT => {
        if (!nT.customFields) return undefined;
        const nain = nT.customFields.filter(cf => cf.id === process.env.FIELD_NEXT_ATTENTION_NEEDED)[0];
        const nainDate = new Date(nain.value);
        const now = new Date();
        const durationHours =
            (now.getTime() - nainDate.getTime()) / (1000 * 60 * 60);
        return {
            id: nT.id,
            title: nT.title,
            link: nT.permalink,
            type: "NANFA",
            description: "📍 Next attention is needed from assignee.",
            actionNeededFromDate: nain.value,
            actionNeededUntilDate: nain.value,
            overdueDuration: Math.max(durationHours - 24, 0),
        } satisfies ActionItem
    }).filter(nt => !!nt);

    const dtmbfAI = (dtmbfTasks as WrikeTask[]).map(dT => {
        if (!dT.customFields) return undefined;
        const dtmbf = dT.customFields.filter(cf => cf.id === process.env.FIELD_DATE_THAT_MUST_BE_FINISHED)[0];
        const dtmbfDate = new Date(dtmbf.value);
        const now = new Date();
        const durationHours =
            (now.getTime() - dtmbfDate.getTime()) / (1000 * 60 * 60);

        return {
            id: dT.id,
            title: dT.title,
            link: dT.permalink,
            type: "DTMBF",
            description: "📍 Date that must be finished.",
            actionNeededFromDate: "-",
            actionNeededUntilDate: dtmbf.value,
            overdueDuration: Math.max(durationHours - 24, 0),
        } satisfies ActionItem
    }).filter(dt => !!dt);

    return [...nainAI, ...dtmbfAI];
}

async function fetchDateTypeActionItems(userId: string | undefined) {
    const assignedTasksResponse = await axiosRequest<WrikeApiTasksResponse>(
        "GET",
        `/tasks?responsibles=[${userId}]&fields=[customFields]`
    );
    // assigned tasks
    const assignedTasks = assignedTasksResponse.data.data ?? [];
    return buildDateTypeActionItems(assignedTasks);
}

async function fetchSpaceItemDateTypeActionItems(userId: string, taskIds: string[]) {
    const tasks = await getTasksForSession(userId);
    // // next attention is needed:
    const filteredTasks = tasks.filter(t => taskIds.includes(t.id));
    return buildDateTypeActionItems(filteredTasks);
}

export async function fetchActionItems(userId: string, legacyUserId: string) {
    const anfActionItems = await fetchUserANFActionItems(legacyUserId);
    const dateTypeActionItems = await fetchDateTypeActionItems(userId);
    const actionItems = [...anfActionItems, ...dateTypeActionItems]
        .sort((a, b) => b?.overdueDuration - a?.overdueDuration);
    return actionItems as ActionItem[];
}

export async function fetchFolderActionItems(userId: string, taskIds: string[]) {
    const anfActionItems = await fetchSpaceItemANFActionItems(taskIds);
    const dateTypeActionItems = await fetchSpaceItemDateTypeActionItems(userId, taskIds);
    const actionItems = [...anfActionItems, ...dateTypeActionItems]
        .sort((a, b) => b?.overdueDuration - a?.overdueDuration);
    return actionItems as ActionItem[];
}