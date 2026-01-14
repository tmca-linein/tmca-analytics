import { axiosRequest } from "@/lib/axios";
import { fetchTopTenLongestActiveANFDurations } from "./anfRetriever";
import pLimit from 'p-limit';
import { WrikeApiTasksResponse, WrikeTask } from "@/types/wrikeItem";
import { ActionItem } from "@/app/users/[userId]/UserActionItems";
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

async function fetchANFActionItems(legacyUserId: string | undefined) {
    const anfEvents = await fetchTopTenLongestActiveANFDurations(legacyUserId);
    const actionItemPromises = anfEvents.map((ae) =>
        limit(async () => {
            const taskResult = await with404Fallback(
                axiosRequest<WrikeApiTasksResponse>("GET", `/tasks/${ae.wrikeItemId}`)
            );

            const task =
                taskResult.ok
                    ? taskResult.value.data.data[0]
                    : taskResult.status === 404
                        ? { title: "***You are not authorised to view this task***", permalink: "#" }
                        : { title: "Error occurred while loading the task!", permalink: "#" };

            return {
                id: ae.id,
                title: task.title,
                link: task.permalink,
                type: "ANF",
                description: "📍 Answer is needed within 24h!",
                actionNeededFromDate: ae.added_at.toISOString(),
                actionNeededUntilDate: new Date(ae.added_at.getTime() + 24 * 60 * 60 * 1000).toISOString(),
                overdueDuration: Math.max(ae.duration_hours - 24, 0),
            } satisfies ActionItem;
        })
    );

    const actionItems: ActionItem[] = await Promise.all(actionItemPromises);
    return actionItems;
}

async function fetchDateTypeActionItems(userId: string | undefined) {
    const assignedTasksResponse = await axiosRequest<WrikeApiTasksResponse>(
        "GET",
        `/tasks?responsibles=[${userId}]&fields=[customFields]`
    );
    // assigned tasks
    const assignedTasks = assignedTasksResponse.data.data ?? [];
    // // next attention is needed:
    const nain = assignedTasks.filter(at => at.status === "Active" && at.customFields?.some(cf => cf.id === process.env.FIELD_NEXT_ATTENTION_NEEDED && cf.value !== null && cf.value !== ""))
    // // date that must be finished:
    const dtmbf_active = assignedTasks.filter(at => at.status === "Active" && at.customFields?.some(cf => cf.id === process.env.FIELD_DATE_THAT_MUST_BE_FINISHED && cf.value !== null && cf.value !== ""))

    const nainTasks = (nain as WrikeTask[]).map(nT => {
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

    const dtmbfTasks = (dtmbf_active as WrikeTask[]).map(dT => {
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

    return [...nainTasks, ...dtmbfTasks];
}

export async function fetchActionItems(userId: string | undefined, legacyUserId: string | undefined) {
    const anfActionItems = await fetchANFActionItems(legacyUserId);
    const dateTypeActionItems = await fetchDateTypeActionItems(userId);
    const actionItems = [...anfActionItems, ...dateTypeActionItems]
        .sort((a, b) => b?.overdueDuration - a?.overdueDuration);
    return actionItems as ActionItem[];
} 