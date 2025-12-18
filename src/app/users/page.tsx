import prisma from '@/lib/db';
import { startOfDay, startOfWeek, startOfMonth, endOfDay, endOfMonth, endOfWeek } from 'date-fns';
import { UsersTable } from './WrikeUsersTable';
import { axiosRequest } from '@/lib/axios';
import { ApiWrikeUserGroup, WrikeApiContactsResponse, WrikeApiUserGroupResponse, WrikeLegacyIdConversionResponse } from '@/types/user';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth';
import { getUserIdMapping } from "@/cache/legacyId-cache";
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
  const memberIds = [...new Set(
    groupsWithMembers.filter(g => leafMemberGroups.includes(g.id))
      .map(leaf => !!leaf.memberIds ? leaf.memberIds : [])
      .reduce((prev, cur) => [...prev, ...cur], [])
  )];
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
  const todayEnd = endOfDay(now);
  const addedTodayCounts = await prisma.$queryRaw<
    { assignedUserId: string; count: number }[]>`
      SELECT
        "assignedUserId",
        COUNT(*)::int AS count
      FROM "ANFEvent"
      WHERE
        state = 'ADDED'
        AND "eventDate" BETWEEN ${todayStart} AND ${todayEnd}
        AND "assignedUserId" <> "authorUserId"
      GROUP BY "assignedUserId"
    `;
  const removedTodayCounts = await prisma.$queryRaw<
    { assignedUserId: string; count: number }[]>`
      SELECT
        "assignedUserId",
        COUNT(*)::int AS count
      FROM "ANFEvent"
      WHERE
        state = 'REMOVED'
        AND "eventDate" BETWEEN ${todayStart} AND ${todayEnd}
        AND EXISTS (
                SELECT 1
                FROM "CommentEvent" ce
                WHERE ce."wrikeItemId" = "ANFEvent"."wrikeItemId"
                AND ce."userId" = "ANFEvent"."authorUserId"
                AND ce."eventDate" BETWEEN
                    "ANFEvent"."eventDate" - INTERVAL '10 minutes'
                    AND "ANFEvent"."eventDate" + INTERVAL '10 minutes'
            )
      GROUP BY "assignedUserId"
    `;

  // const removedTodayCounts = await prisma.aNFEvent.groupBy({
  //   by: ['assignedUserId'],
  //   where: {
  //     state: 'REMOVED',
  //     eventDate: {
  //       gte: todayStart,
  //       lte: todayEnd,
  //     },
  //   },
  //   _count: {
  //     id: true,
  //   },
  // });

  const addedCommentsTodayCounts = await prisma.commentEvent.groupBy({
    by: ['userId'],
    where: {
      eventDate: {
        gte: todayStart,
        lte: todayEnd,
      },
    },
    _count: {
      id: true,
    },
  });


  const userIdsMapping = await getUserIdMapping();

  // Transform into maps: userId → count
  const addedTodayMap = Object.fromEntries(
    addedTodayCounts.map(c => [c.assignedUserId, c.count])
  );

  const removedTodayMap = Object.fromEntries(
    removedTodayCounts.map(c => [c.assignedUserId, c.count])
  );

  const addedCommentsTodayMap = Object.fromEntries(
    addedCommentsTodayCounts.map(c => [c.userId, c._count.id])
  )

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
        anfAddedToday: !!userMapping ? (addedTodayMap[userMapping.apiV2Id] ?? 0) : 0,
        anfRemovedToday: !!userMapping ? (removedTodayMap[userMapping.apiV2Id] ?? 0) : 0,
        commentsAddedToday: !!userMapping ? (addedCommentsTodayMap[userMapping.apiV2Id] ?? 0) : 0
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
