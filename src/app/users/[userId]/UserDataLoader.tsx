import UserStatistics from '@/app/users/[userId]/UserStatistics';
import { UserActivityWindow } from '@/app/users/[userId]/UserActivityWindow';
import { getUserIdMapping } from "@/cache/legacyId-cache";
import CommentsChart, { CommentsRow } from './CommentsChart';
import AnfDuration, { AnfDurationRow } from './AnfDuration';
import { fetchANFData } from '@/app/stats/anfRetriever';
import { fetchDailyActivity } from '@/app/stats/dailyActivityRetriever';
import { fetchCommentStats } from '@/app/stats/commentsRetriever';
import { UserActionItems } from "@/app/users/[userId]/UserActionItems";
import { fetchActionItems } from "@/app/stats/actionItemsRetriever";
import AnfStats, { AnfStatsRow } from "./AnfStatsChart";

export default async function UserDataLoader(props: {
    userId: string;
}) {
    const { userId } = await props;
    const userIdsMapping = await getUserIdMapping();
    const legacyMappings = userIdsMapping.filter(m => m.id === userId)
    const legacyUserId = legacyMappings.length > 0 ? legacyMappings[0].apiV2Id : undefined;
    // const { nainItems, dtmbfItems } = await fetchTaskAttentionItems(userId);
    const [
        { commentActivity, historicalCommentData },
        latestActivity,
        { anfActivity, historicalANFData, anfDuration },
        actionItems
    ] = await Promise.all([
        fetchCommentStats(userId),
        fetchDailyActivity(legacyUserId),
        fetchANFData(userId, legacyUserId),
        fetchActionItems(userId, legacyUserId)
    ]);

    return (
        <>
            <div className="bg-primary-foreground p-4 rounded-lg">
                <UserActivityWindow items={latestActivity} />
            </div>
            <div className="bg-primary-foreground p-4 rounded-lg lg:col-span-2 xl:col-span-1 2xl:col-span-2">
                <UserActionItems items={actionItems} />
            </div>
            <div className="bg-primary-foreground p-4 rounded-lg lg:col-span-2 xl:col-span-1 2xl:col-span-2">
                <AnfStats anfData={historicalANFData as AnfStatsRow[]} />
            </div>
            <div className="bg-primary-foreground p-4 rounded-lg lg:col-span-2 xl:col-span-1 2xl:col-span-2">
                <AnfDuration anfData={anfDuration as AnfDurationRow[]} />
            </div>
            <div className="bg-primary-foreground p-4 rounded-lg lg:col-span-2 xl:col-span-1 2xl:col-span-2">
                <CommentsChart data={historicalCommentData as CommentsRow[]} />
            </div>
            <div className="bg-primary-foreground p-4 rounded-lg lg:col-span-2 xl:col-span-1 2xl:col-span-2">
                <UserStatistics anfActivity={anfActivity} commentActivity={commentActivity} />
            </div>
            {/* <div className="bg-primary-foreground p-4 rounded-lg">
                <AppCalendarView title="📍Next attention needed from assignee" items={nainItems as AttentionItem[]} />
            </div>
            <div className="bg-primary-foreground p-4 rounded-lg">
                <AppCalendarView title="📍Date that must be finished" items={dtmbfItems as AttentionItem[]} />
            </div> */}
        </>
    )
}