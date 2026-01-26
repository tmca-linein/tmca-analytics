import { getSelectedFolderTasksTraversal } from "@/cache/folder-cache";
import { AppActivityWindow } from "@/components/AppActivityWindow";
import AnfDuration from "@/components/AppAnfDuration";
import AnfStats, { AnfStatsRow } from "@/components/AppAnfStatsChart";
import CommentsChart, { CommentsRow } from "@/components/AppCommentsChart";
import { AppActionItems } from "@/components/AppActionItems";
import { fetchFolderActionItems } from "@/stats/actionItemsRetriever";
import { fetchFolderDailyActivity } from "@/stats/dailyActivityRetriever";
import AppItemStatistics from '@/components/AppItemStatistics';
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { SessionExpired } from "@/components/AppSessionExpired";
import FolderUsers from "./FolderUsers";
import { fetchSpaceItemUserTableData } from "@/stats/userRetriever";
import { fetchHistoricalANFData, fetchSpaceItemANFActivity, fetchSpaceItemANFDuration } from "@/stats/anfRetriever";
import { fetchHistoricalCommentData, fetchSpaceItemCommentActivity } from "@/stats/commentsRetriever";
import { ANFDuration } from "@/types/stats";


export default async function ItemDataLoader(props: {
    itemId: string;
    isProject: boolean;
}) {
    const { itemId } = await props;
    if (!itemId) return <>No item</>;
    const session = await getServerSession(authConfig);
    if (!session) return <SessionExpired />;
    const itemIds = await getSelectedFolderTasksTraversal(session.user.id, itemId);
    const [
        latestActivity,
        actionItems,
        anfActivity,
        historicalANFData,
        anfDuration,
        commentActivity,
        historicalCommentData,
        userData
    ] = await Promise.all([
        fetchFolderDailyActivity(itemIds),
        fetchFolderActionItems(session.user.id, itemIds),
        fetchSpaceItemANFActivity(itemIds),
        fetchHistoricalANFData(null, itemIds),
        fetchSpaceItemANFDuration(itemIds),
        fetchSpaceItemCommentActivity(itemIds),
        fetchHistoricalCommentData(null, itemIds),
        fetchSpaceItemUserTableData(session.user.id, itemIds)
    ]);

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