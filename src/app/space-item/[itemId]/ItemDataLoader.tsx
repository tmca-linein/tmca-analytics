import { AppActivityWindow } from "@/components/stats/AppActivityWindow";
import AnfDuration from "@/components/stats/AppAnfDuration";
import AnfStats from "@/components/stats/AppAnfStatsChart";
import CommentsChart from "@/components/stats/AppCommentsChart";
import { AppActionItems } from "@/components/stats/AppActionItems";
import { fetchFolderActionItems } from "@/stats/actionItemsRetriever";
import { fetchFolderDailyActivity } from "@/stats/dailyActivityRetriever";
import AppItemStatistics from '@/components/stats/AppItemStatistics';
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { SessionExpired } from "@/components/AppSessionExpired";
import FolderUsers from "./FolderUsers";
import { ANFDuration, AnfStatsRow, CommentsRow, DisplayItemMetrics, SpaceItemANFActivity, SpaceItemCommentActivity } from "@/types/stats";
import { getFolderDescendantIds } from "@/cache/folderAllTaskDescendant-cache";
import { getSpaceItemHistoricalMetrics } from "@/cache/spaceItemMetrics-cache";
import { fetchSpaceItemUserTableData } from "@/stats/spaceItemUserRetriever";
import { toLocalYYYYMMDD } from "@/lib/utils";

const DUMMY_ANF_ACTIVITY = {
    addedDay: 0,
    addedWeek: 0,
    addedMonth: 0,
    addedLastMonth: 0,
    removedDay: 0,
    removedWeek: 0,
    removedMonth: 0,
    removedLastMonth: 0
};

const DUMMY_COMMENT_ACTIVITY = {
    countDay: 0,
    countWeek: 0,
    countMonth: 0,
    countLastMonth: 0,
    avgWordCountDay: 0,
    avgWordCountWeek: 0,
    avgWordCountMonth: 0,
    avgWordCountLastMonth: 0
};

function buildHistoricalActivity(spaceMetrics: DisplayItemMetrics[]) {
    const historicalANFData: AnfStatsRow[] = [];
    const historicalCommentData: CommentsRow[] = [];

    for (const metric of spaceMetrics) {
        const dayBefore = new Date(metric.day);
        dayBefore.setDate(dayBefore.getDate() - 1);
        const dayBeforeStr = dayBefore.toISOString().slice(0, 10); // due to snapshots we use yesterday timestamp.
        historicalANFData.push({
            date: dayBeforeStr,
            added: metric.anfAddedDay ?? 0,
            removed: metric.anfRemovedDay ?? 0
        });

        historicalCommentData.push({
            date: dayBeforeStr,
            comments: metric.countDay ?? 0
        });
    }

    return { historicalANFData, historicalCommentData };
}

function buildAccumulatedActivity(spaceMetrics: DisplayItemMetrics[]) {
    for (const metric of spaceMetrics) {
        if (toLocalYYYYMMDD(new Date(metric.day)) === toLocalYYYYMMDD(new Date())) {
            const anfActivity: SpaceItemANFActivity = {
                addedDay: metric.anfAddedDay ?? 0,
                addedWeek: metric.anfAddedWeek ?? 0,
                addedMonth: metric.anfAddedMonth ?? 0,
                addedLastMonth: metric.anfAddedLastMonth ?? 0,
                removedDay: metric.anfAddedDay ?? 0,
                removedWeek: metric.anfAddedWeek ?? 0,
                removedMonth: metric.anfAddedMonth ?? 0,
                removedLastMonth: metric.anfRemovedLastMonth ?? 0
            };

            const commentActivity: SpaceItemCommentActivity = {
                countDay: metric.countDay ?? 0,
                countWeek: metric.countWeek ?? 0,
                countMonth: metric.countMonth ?? 0,
                countLastMonth: metric.countLastMonth ?? 0,
                avgWordCountDay: metric.avgWordCountDay ?? 0,
                avgWordCountWeek: metric.avgWordCountWeek ?? 0,
                avgWordCountMonth: metric.avgWordCountMonth ?? 0,
                avgWordCountLastMonth: metric.avgWordCountLastMonth ?? 0
            }

            const anfDuration: ANFDuration[] = metric.bucketWeek ? [{
                granularity: "week",
                bucket: toLocalYYYYMMDD(new Date(metric.bucketWeek ?? '')),
                assignedUserId: '',
                root_id: '',
                avgduration: metric.avgDurationWeek ?? 0,
                topfiveavgduration: metric.topFiveAvgDurationWeek ?? 0,
                transitions_count: metric.transitionsCountWeek ?? 0,
                overdue_count: metric.overdueCountWeek ?? 0,
                avgoverduehours: metric.avgOverdueHoursWeek ?? 0
            },
            {
                granularity: "month",
                bucket: toLocalYYYYMMDD(new Date(metric.bucketMonth ?? '')),
                assignedUserId: '',
                root_id: '',
                avgduration: metric.avgDurationMonth ?? 0,
                topfiveavgduration: metric.topFiveAvgDurationMonth ?? 0,
                transitions_count: metric.transitionsCountMonth ?? 0,
                overdue_count: metric.overdueCountMonth ?? 0,
                avgoverduehours: metric.avgOverdueHoursMonth ?? 0
            },
            {
                granularity: "month",
                bucket: toLocalYYYYMMDD(new Date(metric.bucketLastMonth ?? '')),
                assignedUserId: '',
                root_id: '',
                avgduration: metric.avgDurationLastMonth ?? 0,
                topfiveavgduration: metric.topFiveAvgDurationLastMonth ?? 0,
                transitions_count: metric.transitionsCountLastMonth ?? 0,
                overdue_count: metric.overdueCountLastMonth ?? 0,
                avgoverduehours: metric.avgOverdueHoursLastMonth ?? 0
            }] : [];

            return { anfActivity, commentActivity, anfDuration };
        }
    }

    return { anfActivity: DUMMY_ANF_ACTIVITY, commentActivity: DUMMY_COMMENT_ACTIVITY, anfDuration: [] }
}

export default async function ItemDataLoader(props: {
    itemId: string;
    isProject: boolean;
}) {
    const { itemId } = await props;
    if (!itemId) return <>No item</>;
    const session = await getServerSession(authConfig);
    if (!session) return <SessionExpired />;
    const { task, folder } = await getFolderDescendantIds(itemId);
    const itemIds = [...task, ...folder];
    const [
        latestActivity,
        actionItems,
        spaceMetrics,
        userData
    ] = await Promise.all([
        fetchFolderDailyActivity(itemIds),
        fetchFolderActionItems(task),
        getSpaceItemHistoricalMetrics(itemId),
        fetchSpaceItemUserTableData(session.user.id, itemId)
    ]);
    const { historicalANFData, historicalCommentData } = buildHistoricalActivity(spaceMetrics);
    const { anfActivity, commentActivity, anfDuration } = buildAccumulatedActivity(spaceMetrics);
    return (
        <>
            <div className="bg-primary-foreground p-4 rounded-lg">
                <AppActivityWindow items={latestActivity} />
            </div>
            <div className="bg-primary-foreground p-4 rounded-lg lg:col-span-2 xl:col-span-2 2xl:col-span-2">
                <AppActionItems items={actionItems} type={props.isProject ? "project" : "folder"} />
            </div>
            <div className="bg-primary-foreground p-4 rounded-lg lg:col-span-2 xl:col-span-2 2xl:col-span-2">
                <AnfStats anfData={historicalANFData as AnfStatsRow[]} />
            </div>
            <div className="bg-primary-foreground p-4 rounded-lg lg:col-span-2 xl:col-span-2 2xl:col-span-2">
                <AnfDuration anfData={anfDuration as ANFDuration[]} />
            </div>
            <div className="bg-primary-foreground p-4 rounded-lg lg:col-span-2 xl:col-span-2 2xl:col-span-2">
                <CommentsChart data={historicalCommentData as CommentsRow[]} />
            </div>
            <div className="bg-primary-foreground p-4 rounded-lg lg:col-span-2 xl:col-span-2 2xl:col-span-2">
                <AppItemStatistics title={`${props.isProject ? "Project" : "Folder"} statistics`} anfActivity={anfActivity} commentActivity={commentActivity} />
            </div>
            <div className="bg-primary-foreground p-4 rounded-lg lg:col-span-2 xl:col-span-3 2xl:col-span-4">
                <FolderUsers data={userData} isProject={props.isProject} />
            </div>
        </>
    )
}