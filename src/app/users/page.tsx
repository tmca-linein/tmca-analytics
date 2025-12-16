import prisma from '@/lib/db';
import { startOfDay, startOfWeek, startOfMonth, endOfDay, endOfMonth, endOfWeek } from 'date-fns';
import { UsersTable } from './WrikeUsersTable';
import { axiosRequest } from '@/lib/axios';
import { ApiWrikeUserGroup, WrikeApiContactsResponse, WrikeApiUserGroupResponse, WrikeLegacyIdConversionResponse } from '@/types/user';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth';
import pLimit from 'p-limit';
const limit = pLimit(10);


const getRecursiveSubOrdinates = (allGroups: ApiWrikeUserGroup[], rootId: string): string[] => {
  const groupMap = new Map(allGroups.map(g => [g.id, g]));
  const leaves: string[] = [];
  const stack = [rootId];

  while (stack.length > 0) {
    const currentId = stack.pop()!;
    const currentGroup = groupMap.get(currentId);

    if (!currentGroup) continue;

    const children = allGroups.filter(g =>
      g.parentIds.includes(currentId)
    );

    for (const child of children) {
      if (child.childIds.length === 0) {
        leaves.push(child.id);
      } else {
        stack.push(child.id);
      }
    }
  }

  return leaves;
};

const getSubOrdinates = async (userId: string) => {
  const userGroupsResponse = await axiosRequest<WrikeApiUserGroupResponse>("GET", "/groups");
  const userGroups = userGroupsResponse?.data?.data;
  const ceoUserGroups = userGroups.filter(ug => ug.title.endsWith("CEO"))
  const ceoOf = ceoUserGroups.filter(ug => ug.memberIds.includes(userId))
  if (!ceoOf || ceoOf.length === 0) return [];
  const companyParentGroup = ceoOf[0].parentIds[0];
  const leafMemberGroups = getRecursiveSubOrdinates(userGroups, companyParentGroup)
  const response = await axiosRequest<WrikeApiContactsResponse>("GET", '/contacts?types=["Group"]');
  const groupsWithMembers = response.data.data;
  const memberIds = groupsWithMembers.filter(g => leafMemberGroups.includes(g.id))
    .map(leaf => !!leaf.memberIds ? leaf.memberIds : [])
    .reduce((prev, cur) => [...prev, ...cur], []);
  if (memberIds.length === 0) return [];
  const userResponses = await Promise.all(
    memberIds.map(memId => limit(async () => {
      return axiosRequest<WrikeApiContactsResponse>(
        "GET",
        `/users/${memId}`
      ).catch(() => ({ data: { data: [] } }))
    }))
  );

  const allSubOrdinates = userResponses.flatMap((res) => res.data.data);
  return allSubOrdinates;
}

const fetchWrikeUsers = async () => {
  const now = new Date();

  const todayStart = startOfDay(now);
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const monthStart = startOfMonth(now);
  const todayEnd = endOfDay(now);
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const monthEnd = endOfMonth(now);

  const [addedTodayCounts, addedWeekCounts, addedMonthCounts] = await Promise.all([
    // Today
    prisma.aNFEvent.groupBy({
      by: ['assignedUserId'],
      where: {
        state: 'ADDED',
        eventDate: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
      _count: {
        id: true,
      },
    }),

    // This week
    prisma.aNFEvent.groupBy({
      by: ['assignedUserId'],
      where: {
        state: 'ADDED',
        eventDate: {
          gte: weekStart,
          lte: weekEnd,
        },
      },
      _count: {
        id: true,
      },
    }),

    // This month
    prisma.aNFEvent.groupBy({
      by: ['assignedUserId'],
      where: {
        state: 'ADDED',
        eventDate: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
      _count: {
        id: true,
      },
    }),
  ]);

  const uniqueLegacyUsers = await prisma.aNFEvent.findMany({
    distinct: ["assignedUserId"],
    select: { assignedUserId: true },
  });
  const uniqueAssignedUserIds = uniqueLegacyUsers.map(u => u.assignedUserId);
  const userIdsMappingResponse = await axiosRequest<WrikeLegacyIdConversionResponse>("GET", `/ids?type=ApiV2User&ids=[${uniqueAssignedUserIds.join(',')}]`);
  const userIdsMapping = userIdsMappingResponse?.data.data ?? [];

  const [removedTodayCounts, removedWeekCounts, removedMonthCounts] = await Promise.all([
    // Today
    prisma.aNFEvent.groupBy({
      by: ['assignedUserId'],
      where: {
        state: 'REMOVED',
        eventDate: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
      _count: {
        id: true,
      },
    }),

    // This week
    prisma.aNFEvent.groupBy({
      by: ['assignedUserId'],
      where: {
        state: 'REMOVED',
        eventDate: {
          gte: weekStart,
          lte: weekEnd,
        },
      },
      _count: {
        id: true,
      },
    }),

    // This month
    prisma.aNFEvent.groupBy({
      by: ['assignedUserId'],
      where: {
        state: 'REMOVED',
        eventDate: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
      _count: {
        id: true,
      },
    }),
  ]);

  // Transform into maps: userId → count
  const addedTodayMap = Object.fromEntries(
    addedTodayCounts.map(c => [c.assignedUserId, c._count.id])
  );
  const addedWeekMap = Object.fromEntries(
    addedWeekCounts.map(c => [c.assignedUserId, c._count.id])
  );
  const addedMonthMap = Object.fromEntries(
    addedMonthCounts.map(c => [c.assignedUserId, c._count.id])
  );

  const removedTodayMap = Object.fromEntries(
    removedTodayCounts.map(c => [c.assignedUserId, c._count.id])
  );
  const removedWeekMap = Object.fromEntries(
    removedWeekCounts.map(c => [c.assignedUserId, c._count.id])
  );
  const removedMonthMap = Object.fromEntries(
    removedMonthCounts.map(c => [c.assignedUserId, c._count.id])
  );

  // Now fetch users and attach the counts
  const session = await getServerSession(authConfig);
  if (session) {
    const users = await getSubOrdinates(session.user?.id);
    const result = users.filter(u => !u.deleted).map(user => {
      const userMapping = userIdsMapping.filter(m => m.id === user.id)[0]
      return ({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        primaryEmail: user.primaryEmail,
        anfAddedToday: !!userMapping ? addedTodayMap[userMapping.apiV2Id] : 0,
        anfAddedThisWeek: !!userMapping ? addedWeekMap[userMapping.apiV2Id] : 0,
        anfAddedThisMonth: !!userMapping ? addedMonthMap[userMapping.apiV2Id] : 0,
        anfRemovedToday: !!userMapping ? removedTodayMap[userMapping.apiV2Id] : 0,
        anfRemovedThisWeek: !!userMapping ? removedWeekMap[userMapping.apiV2Id] : 0,
        anfRemovedThisMonth: !!userMapping ? removedMonthMap[userMapping.apiV2Id] : 0,
      })
    });
    return result;
  }

  return [];
};


const SpaceItemsPage = async () => {
  const data = await fetchWrikeUsers();

  return (
    <>
      <div className="mb-8 px-4 py-2 bg-secondary rounded-md">
        <h1 className="font-semibold">Users overview</h1>
      </div>
      <div className="flex-1 overflow-hidden">
        <UsersTable initialData={data} />
      </div>
    </>
  );
};

export default SpaceItemsPage;
