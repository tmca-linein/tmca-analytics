import { AttentionItem } from "@/components/AppCalendarView";
import { axiosRequest } from "@/lib/axios";
import { WrikeApiTasksResponse, WrikeTask } from "@/types/wrikeItem";

export async function fetchTaskAttentionItems(userId: string): Promise<Record<string, (AttentionItem | undefined)[]>> {
    const assignedTasksResponse = await axiosRequest<WrikeApiTasksResponse>(
        "GET",
        `/tasks?responsibles=[${userId}]&fields=[customFields]`
    );

    // assigned tasks
    const assignedTasks = assignedTasksResponse.data.data ?? [];
    // // next attention is needed:
    const nain = assignedTasks.filter(at => at.customFields?.some(cf => cf.id === process.env.FIELD_NEXT_ATTENTION_NEEDED && cf.value != null))
    // // date that must be finished:
    const dtmbf = assignedTasks.filter(at => at.customFields?.some(cf => cf.id === process.env.FIELD_DATE_THAT_MUST_BE_FINISHED && cf.value != null))

    const nainItems = (nain as WrikeTask[]).map((nT, index) => {
        if (!nT.customFields) return;
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
        } as AttentionItem
    });

    const dtmbfItems = (dtmbf as WrikeTask[]).map((dT, index) => {
        if (!dT.customFields) return;
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
        } as AttentionItem
    }) ?? [];


    return {
        nainItems,
        dtmbfItems
    }
}
