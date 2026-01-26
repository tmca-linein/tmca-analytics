import ItemStatistics from '@/components/AppItemStatistics';
import { AppActivityWindow } from '@/components/AppActivityWindow';
import { getUserIdMapping } from "@/cache/legacyId-cache";
import CommentsChart, { CommentsRow } from '../../../components/AppCommentsChart';
import AnfDuration from '../../../components/AppAnfDuration';
import { fetchHistoricalANFData, fetchUserANFActivity, fetchUserANFDuration } from '@/stats/anfRetriever';
import { fetchTaskDailyActivity } from '@/stats/dailyActivityRetriever';
import { fetchHistoricalCommentData, fetchUserCommentActivity } from '@/stats/commentsRetriever';
import { AppActionItems } from "@/components/AppActionItems";
import { fetchActionItems } from "@/stats/actionItemsRetriever";
import AnfStats, { AnfStatsRow } from "../../../components/AppAnfStatsChart";
import { ANFDuration } from '@/types/stats';

export default async function UserDataLoader(props: {
    userId: string;
}) {
    const { userId } = await props;
    const { v4ToLegacy } = await getUserIdMapping();
    const legacyUserId = String(v4ToLegacy.get(userId));
    const [
        commentActivity,
        historicalCommentData,
        latestActivity,
        anfActivity,
        historicalANFData,
        anfDuration,
        actionItems
    ] = await Promise.all([
        fetchUserCommentActivity(userId),
        fetchHistoricalCommentData(userId, []),
        fetchTaskDailyActivity(legacyUserId, userId),
        fetchUserANFActivity(legacyUserId),
        fetchHistoricalANFData(legacyUserId, []),
        fetchUserANFDuration(legacyUserId),
        fetchActionItems(userId, legacyUserId)
    ]);

    return (
        <>
            <div className="bg-primary-foreground p-4 rounded-lg">
                <AppActivityWindow items={latestActivity} />
            </div>
            <div className="bg-primary-foreground p-4 rounded-lg lg:col-span-2 xl:col-span-1 2xl:col-span-2">
                <AppActionItems items={actionItems} type="user" />
            </div>
            <div className="bg-primary-foreground p-4 rounded-lg lg:col-span-2 xl:col-span-1 2xl:col-span-2">
                <AnfStats anfData={historicalANFData as AnfStatsRow[]} />
            </div>
            <div className="bg-primary-foreground p-4 rounded-lg lg:col-span-2 xl:col-span-1 2xl:col-span-2">
                <AnfDuration anfData={anfDuration as ANFDuration[]} />
            </div>
            <div className="bg-primary-foreground p-4 rounded-lg lg:col-span-2 xl:col-span-1 2xl:col-span-2">
                <CommentsChart data={historicalCommentData as CommentsRow[]} />
            </div>
            <div className="bg-primary-foreground p-4 rounded-lg lg:col-span-2 xl:col-span-1 2xl:col-span-2">
                <ItemStatistics title="User statistics" anfActivity={anfActivity} commentActivity={commentActivity} />
            </div>
        </>
    )
}