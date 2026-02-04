import prisma from "@/lib/db";
import { getUserIdMapping } from "@/cache/legacyId-cache";
import { getSubordinates } from "@/cache/ug-cache";
import { fetchBulkUserANFActivity, fetchBulkUserANFDuration } from "./anfRetriever";
import { ANFDuration, BulkUserANFActivity, BulkUserCommentActivity } from "@/types/stats";
import { fetchBulkUserCommentActivity } from "./commentsRetriever";
import { ApiWrikeUser, User } from "@/types/user";
import { sameMoment, startOfLastMonthUTC, startOfMonthUTC, startOfWeekMondayUTC } from "@/lib/utils";

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
    const lastMonthAnfDurationMap = new Map<string, ANFDuration>();
    for (const anfDurationItem of anfDuration) {
        if ((anfDurationItem.granularity === "week")
            && (sameMoment(anfDurationItem.bucket, startOfWeekMondayUTC().toISOString()))) {
            weekAnfDurationMap.set(anfDurationItem.assignedUserId, anfDurationItem);
        }

        if ((anfDurationItem.granularity === "month")
            && (sameMoment(anfDurationItem.bucket, startOfMonthUTC().toISOString()))) {
            monthAnfDurationMap.set(anfDurationItem.assignedUserId, anfDurationItem);
        }

        if ((anfDurationItem.granularity === "month")
            && (sameMoment(anfDurationItem.bucket, startOfLastMonthUTC().toISOString()))) {
            lastMonthAnfDurationMap.set(anfDurationItem.assignedUserId, anfDurationItem);
        }
    }

    return usersToFill.map(user => {
        const legacyId = v4ToLegacyMappings.get(user.id) ?? '';
        return ({
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            primaryEmail: user.primaryEmail,
            anfAddedDay: anfUserDataMap[legacyId].addedDay ?? 0,
            anfAddedWeek: anfUserDataMap[legacyId].addedWeek ?? 0,
            anfAddedMonth: anfUserDataMap[legacyId].addedMonth ?? 0,
            anfAddedLastMonth: anfUserDataMap[legacyId].addedLastMonth ?? 0,
            anfRemovedDay: anfUserDataMap[legacyId].removedDay ?? 0,
            anfRemovedWeek: anfUserDataMap[legacyId].removedWeek ?? 0,
            anfRemovedMonth: anfUserDataMap[legacyId].removedMonth ?? 0,
            anfRemovedLastMonth: anfUserDataMap[legacyId].removedLastMonth ?? 0,
            countDay: commentUserDataMap[user.id]?.countDay ?? 0,
            countWeek: commentUserDataMap[user.id]?.countWeek ?? 0,
            countMonth: commentUserDataMap[user.id]?.countMonth ?? 0,
            countLastMonth: commentUserDataMap[user.id]?.countLastMonth ?? 0,
            avgWordCountDay: Math.round(commentUserDataMap[user.id]?.avgWordCountDay ?? 0),
            avgWordCountWeek: Math.round(commentUserDataMap[user.id]?.avgWordCountWeek ?? 0),
            avgWordCountMonth: Math.round(commentUserDataMap[user.id]?.avgWordCountMonth ?? 0),
            avgWordCountLastMonth: Math.round(commentUserDataMap[user.id]?.avgWordCountLastMonth ?? 0),
            avgDurationWeek: weekAnfDurationMap.get(legacyId)?.avgduration ?? 0,
            avgDurationMonth: monthAnfDurationMap.get(legacyId)?.avgduration ?? 0,
            avgDurationLastMonth: lastMonthAnfDurationMap.get(legacyId)?.avgduration ?? 0,
            topFiveAvgDurationWeek: weekAnfDurationMap.get(legacyId)?.topfiveavgduration ?? 0,
            topFiveAvgDurationMonth: monthAnfDurationMap.get(legacyId)?.topfiveavgduration ?? 0,
            topFiveAvgDurationLastMonth: lastMonthAnfDurationMap.get(legacyId)?.topfiveavgduration ?? 0,
            avgOverdueHoursWeek: weekAnfDurationMap.get(legacyId)?.avgoverduehours ?? 0,
            avgOverdueHoursMonth: monthAnfDurationMap.get(legacyId)?.avgoverduehours ?? 0,
            avgOverdueHoursLastMonth: lastMonthAnfDurationMap.get(legacyId)?.avgoverduehours ?? 0,
            overdueCountWeek: weekAnfDurationMap.get(legacyId)?.overdue_count ?? 0,
            overdueCountMonth: monthAnfDurationMap.get(legacyId)?.overdue_count ?? 0,
            overdueCountLastMonth: lastMonthAnfDurationMap.get(legacyId)?.overdue_count ?? 0,
            transitionsCountWeek: weekAnfDurationMap.get(legacyId)?.transitions_count ?? 0,
            transitionsCountMonth: monthAnfDurationMap.get(legacyId)?.transitions_count ?? 0,
            transitionsCountLastMonth: lastMonthAnfDurationMap.get(legacyId)?.transitions_count ?? 0,
        })
    });
}

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