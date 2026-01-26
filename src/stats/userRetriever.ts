import prisma from "@/lib/db";
import { getUserIdMapping } from "@/cache/legacyId-cache";
import { getSubordinates, retrieveUserData } from "@/lib/ug-extractor";
import { fetchBulkUserANFActivity, fetchBulkUserANFDuration, fetchSpaceItemBulkUserANFActivity, fetchSpaceItemBulkUserANFDuration } from "./anfRetriever";
import { ANFDuration, BulkUserANFActivity, BulkUserCommentActivity } from "@/types/stats";
import { fetchBulkUserCommentActivity, fetchSpaceItemBulkUserCommentActivity } from "./commentsRetriever";
import { ApiWrikeUser, User } from "@/types/user";
import { sameMoment, startOfMonthUTC, startOfQuarterUTC, startOfWeekMondayUTC } from "@/lib/utils";

export async function fetchFolderUsers(itemIds: string[]) {
    const users = await prisma.$queryRaw<{ assignedUserId: string }[]>`
        SELECT
        DISTINCT("assignedUserId")
        FROM "ANFEvent"
        WHERE "wrikeItemId" = ANY(${itemIds})
    `;

    return users;
}

function fillUserTable(
    usersToFill: ApiWrikeUser[],
    v4ToLegacyMappings: Map<string, string>,
    anfData: BulkUserANFActivity[],
    anfDuration: ANFDuration[],
    commentData: BulkUserCommentActivity[]): User[] {
    const anfUserDataMap = Object.fromEntries(
        anfData.map(d => [d.assignedUserId, d])
    );

    const commentUserDataMap = Object.fromEntries(
        commentData.map(d => [d.userId, d])
    );
    const weekAnfDurationMap = new Map<string, ANFDuration>();
    const monthAnfDurationMap = new Map<string, ANFDuration>();
    const quarterAnfDurationMap = new Map<string, ANFDuration>();
    for (const anfDurationItem of anfDuration) {
        if ((anfDurationItem.granularity === "week")
            && (sameMoment(anfDurationItem.bucket, startOfWeekMondayUTC().toISOString()))) {
            weekAnfDurationMap.set(anfDurationItem.assignedUserId, anfDurationItem);
        }

        if ((anfDurationItem.granularity === "month")
            && (sameMoment(anfDurationItem.bucket, startOfMonthUTC().toISOString()))) {
            monthAnfDurationMap.set(anfDurationItem.assignedUserId, anfDurationItem);
        }

        if ((anfDurationItem.granularity === "quarter")
            && (sameMoment(anfDurationItem.bucket, startOfQuarterUTC().toISOString()))) {
            quarterAnfDurationMap.set(anfDurationItem.assignedUserId, anfDurationItem);
        }
    }

    return usersToFill.map(user => {
        const legacyId = v4ToLegacyMappings.get(user.id) ?? '';
        return ({
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            primaryEmail: user.primaryEmail,
            anfAddedToday: anfUserDataMap[legacyId].addedToday ?? 0,
            anfAddedThisWeek: anfUserDataMap[legacyId].addedWeek ?? 0,
            anfAddedThisMonth: anfUserDataMap[legacyId].addedMonth ?? 0,
            anfRemovedToday: anfUserDataMap[legacyId].removedToday ?? 0,
            anfRemovedThisWeek: anfUserDataMap[legacyId].removedWeek ?? 0,
            anfRemovedThisMonth: anfUserDataMap[legacyId].removedMonth ?? 0,
            commentsToday: commentUserDataMap[user.id]?.countToday ?? 0,
            commentsThisWeek: commentUserDataMap[user.id]?.countWeek ?? 0,
            commentsThisMonth: commentUserDataMap[user.id]?.countMonth ?? 0,
            commentAvgWordCountToday: Math.round(commentUserDataMap[user.id]?.avgWordCountToday ?? 0),
            commentAvgWordCountThisWeek: Math.round(commentUserDataMap[user.id]?.avgWordCountWeek ?? 0),
            commentAvgWordCountThisMonth: Math.round(commentUserDataMap[user.id]?.avgWordCountMonth ?? 0),
            anfDurationWeek: weekAnfDurationMap.get(legacyId)?.avgduration ?? 0,
            anfDurationMonth: monthAnfDurationMap.get(legacyId)?.avgduration ?? 0,
            anfDurationQuarter: quarterAnfDurationMap.get(legacyId)?.avgduration ?? 0,
            anfTopFiveDurationWeek: weekAnfDurationMap.get(legacyId)?.topfiveavgduration ?? 0,
            anfTopFiveDurationMonth: monthAnfDurationMap.get(legacyId)?.topfiveavgduration ?? 0,
            anfTopFiveDurationQuarter: quarterAnfDurationMap.get(legacyId)?.topfiveavgduration ?? 0,
            anfOverdueWeek: weekAnfDurationMap.get(legacyId)?.avgoverduehours ?? 0,
            anfOverdueMonth: monthAnfDurationMap.get(legacyId)?.avgoverduehours ?? 0,
            anfOverdueQuarter: quarterAnfDurationMap.get(legacyId)?.avgoverduehours ?? 0,
            anfOverdueCountsWeek: weekAnfDurationMap.get(legacyId)?.overdue_count ?? 0,
            anfOverdueCountsMonth: monthAnfDurationMap.get(legacyId)?.overdue_count ?? 0,
            anfOverdueCountsQuarter: quarterAnfDurationMap.get(legacyId)?.overdue_count ?? 0,
            anfTransitionCountsWeek: weekAnfDurationMap.get(legacyId)?.transitions_count ?? 0,
            anfTransitionCountsMonth: monthAnfDurationMap.get(legacyId)?.transitions_count ?? 0,
            anfTransitionCountsQuarter: quarterAnfDurationMap.get(legacyId)?.transitions_count ?? 0,
        })
    });
}

export const fetchSpaceItemUserTableData = async (sessionUserId: string, itemIds: string[]) => {
    const [anfData, anfDuration, commentData] = await Promise.all([
        fetchSpaceItemBulkUserANFActivity(itemIds),
        fetchSpaceItemBulkUserANFDuration(itemIds),
        fetchSpaceItemBulkUserCommentActivity(itemIds)
    ]);

    const { v4ToLegacy, legacyToV4 } = await getUserIdMapping();
    const subordinates = (await getSubordinates(sessionUserId)).map(u => u.id);
    const folderUsers = await fetchFolderUsers(itemIds); //all users with at least single anf event
    const userIds = []
    for (const u of folderUsers) {
        const userId = legacyToV4.get(u.assignedUserId);
        if (!userId) continue;
        if (subordinates.includes(userId)) userIds.push(userId)
    }

    const allowedUsers = (await retrieveUserData(userIds))
        .filter(u => !u.deleted);


    return fillUserTable(allowedUsers, v4ToLegacy, anfData, anfDuration, commentData);
};

export const fetchUserTableData = async (userId: string) => {
    const [anfData, commentData, anfDuration] = await Promise.all([
        fetchBulkUserANFActivity(),
        fetchBulkUserCommentActivity(),
        fetchBulkUserANFDuration()
    ]);
    const { v4ToLegacy } = await getUserIdMapping();
    const users = (await getSubordinates(userId))
        .filter(u => !u.deleted && v4ToLegacy.get(u.id));
    return fillUserTable(users, v4ToLegacy, anfData, anfDuration, commentData);
};