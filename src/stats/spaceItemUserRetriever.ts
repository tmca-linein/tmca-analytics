
import { getSubordinates, retrieveUserData } from "@/cache/ug-cache";
import { DisplayItemUserMetrics } from "@/types/stats";
import { ApiWrikeUser, User } from "@/types/user";
import { getSpaceItemUserMetrics } from "@/cache/spaceItemMetrics-cache";

function fillUserTable(
    usersToFill: ApiWrikeUser[],
    userMetrics: DisplayItemUserMetrics[]): User[] {
    const userDataMap = Object.fromEntries(
        userMetrics.map(u => [u.userId, u])
    );

    return usersToFill.map(user => {
        return ({
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            primaryEmail: user.primaryEmail,
            anfAddedDay: userDataMap[user.id].anfAddedDay ?? 0,
            anfAddedWeek: userDataMap[user.id].anfAddedWeek ?? 0,
            anfAddedMonth: userDataMap[user.id].anfAddedMonth ?? 0,
            anfAddedLastMonth: userDataMap[user.id].anfAddedLastMonth ?? 0,
            anfRemovedDay: userDataMap[user.id].anfRemovedDay ?? 0,
            anfRemovedWeek: userDataMap[user.id].anfRemovedWeek ?? 0,
            anfRemovedMonth: userDataMap[user.id].anfRemovedMonth ?? 0,
            anfRemovedLastMonth: userDataMap[user.id].anfRemovedLastMonth ?? 0,
            countDay: userDataMap[user.id].countDay ?? 0,
            countWeek: userDataMap[user.id].countWeek ?? 0,
            countMonth: userDataMap[user.id].countMonth ?? 0,
            countLastMonth: userDataMap[user.id].countLastMonth ?? 0,
            avgWordCountDay: Math.round(userDataMap[user.id].avgWordCountDay ?? 0),
            avgWordCountWeek: Math.round(userDataMap[user.id].avgWordCountWeek ?? 0),
            avgWordCountMonth: Math.round(userDataMap[user.id].avgWordCountMonth ?? 0),
            avgWordCountLastMonth: Math.round(userDataMap[user.id].avgWordCountLastMonth ?? 0),
            avgDurationWeek: userDataMap[user.id].avgDurationWeek ?? 0,
            avgDurationMonth: userDataMap[user.id].avgDurationMonth ?? 0,
            avgDurationLastMonth: userDataMap[user.id].avgDurationLastMonth ?? 0,
            topFiveAvgDurationWeek: userDataMap[user.id].topFiveAvgDurationWeek ?? 0,
            topFiveAvgDurationMonth: userDataMap[user.id].topFiveAvgDurationMonth ?? 0,
            topFiveAvgDurationLastMonth: userDataMap[user.id].topFiveAvgDurationLastMonth ?? 0,
            avgOverdueHoursWeek: userDataMap[user.id].avgOverdueHoursWeek ?? 0,
            avgOverdueHoursMonth: userDataMap[user.id].avgOverdueHoursMonth ?? 0,
            avgOverdueHoursLastMonth: userDataMap[user.id].avgOverdueHoursLastMonth ?? 0,
            overdueCountWeek: userDataMap[user.id].overdueCountWeek ?? 0,
            overdueCountMonth: userDataMap[user.id].overdueCountMonth ?? 0,
            overdueCountLastMonth: userDataMap[user.id].overdueCountLastMonth ?? 0,
            transitionsCountWeek: userDataMap[user.id].transitionsCountWeek ?? 0,
            transitionsCountMonth: userDataMap[user.id].transitionsCountMonth ?? 0,
            transitionsCountLastMonth: userDataMap[user.id].transitionsCountLastMonth ?? 0
        })
    });
}

export const fetchSpaceItemUserTableData = async (sessionUserId: string, itemId: string) => {
    const usersMetrics = await getSpaceItemUserMetrics(itemId);
    const subordinates = (await getSubordinates(sessionUserId)).map(u => u.id);
    const folderUsers = usersMetrics.map(u => u.userId);
    const userIds = []
    for (const u of folderUsers) {
        if (subordinates.includes(u)) userIds.push(u);
    }

    const allowedUsers = (await retrieveUserData(userIds))
        .filter(u => !u.deleted);

    return fillUserTable(allowedUsers, usersMetrics);
};
