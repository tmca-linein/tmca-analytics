import { UsersTable } from './WrikeUsersTable';
import { axiosRequest } from '@/lib/axios';
import { ApiWrikeUserGroup, WrikeApiContactsResponse, WrikeApiUserGroupResponse } from '@/types/user';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authConfig } from '@/lib/auth';
import { getUserIdMapping } from "@/cache/legacyId-cache";
import { fetchBulkANFActivity } from '../stats/anfRetriever';
import { fetchBulkCommentActivity } from '../stats/commentsRetriever';


function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

const getAllChildGroupIds = (
  allGroups: ApiWrikeUserGroup[],
  rootId: string
): string[] => {
  const groupMap = new Map(allGroups.map(g => [g.id, g]));

  const result: string[] = [];
  const stack = [...(groupMap.get(rootId)?.childIds ?? [])];
  const visited = new Set<string>();

  while (stack.length) {
    const id = stack.pop()!;
    if (visited.has(id)) continue;
    visited.add(id);

    result.push(id);

    const group = groupMap.get(id);
    if (group?.childIds?.length) {
      stack.push(...group.childIds);
    }
  }

  return result; // all descendants at any depth
};

const getSubOrdinates = async (userId: string) => {
  const userGroupsResponse = await axiosRequest<WrikeApiUserGroupResponse>("GET", "/groups");
  const userGroups = userGroupsResponse?.data?.data;
  const ceoUserGroups = userGroups.filter(ug => ug.title.endsWith("CEO"))
  const ceoOf = ceoUserGroups.filter(ug => ug.memberIds.includes(userId))
  if (!ceoOf || ceoOf.length === 0) return [];
  const companyParentGroup = ceoOf[0].parentIds[0];
  const parentGroupChildren = getAllChildGroupIds(userGroups, companyParentGroup)
  const memberIds = [...new Set(
    userGroups
      .filter(g => parentGroupChildren.includes(g.id))
      .flatMap(g => g.memberIds ?? [])
  )];
  if (memberIds.length === 0) return [];

  const userChunks = chunkArray(memberIds, 100);
  const userResponses = await Promise.all(
    userChunks.map((chunk) =>
      axiosRequest<WrikeApiContactsResponse>(
        "GET",
        `/contacts/${chunk.join(",")}`
      ).catch(() => ({ data: { data: [] } }))
    )
  );
  return userResponses.flatMap((res) => res.data.data);
}

const fetchWrikeUsers = async (userId: string) => {
  const [anfData, commentData] = await Promise.all([
    fetchBulkANFActivity(),
    fetchBulkCommentActivity()
  ]);

  const anfUserDataMap = Object.fromEntries(
    anfData.map(d => [d.assignedUserId, d])
  )
  const commentUserDataMap = Object.fromEntries(
    commentData.map(d => [d.userId, d])
  )

  const userIdsMapping = await getUserIdMapping();

  // Now fetch users and attach the counts
  const users = await getSubOrdinates(userId);
  const result = users.filter(u => !u.deleted).map(user => {
    const userMapping = userIdsMapping.filter(m => m.id === user.id)[0]
    return ({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      primaryEmail: user.primaryEmail,
      anfAddedToday: !!userMapping ? (anfUserDataMap[userMapping.apiV2Id].addedToday ?? 0) : 0,
      anfAddedThisWeek: !!userMapping ? (anfUserDataMap[userMapping.apiV2Id].addedWeek ?? 0) : 0,
      anfAddedThisMonth: !!userMapping ? (anfUserDataMap[userMapping.apiV2Id].addedMonth ?? 0) : 0,
      anfRemovedToday: !!userMapping ? (anfUserDataMap[userMapping.apiV2Id].removedToday ?? 0) : 0,
      anfRemovedThisWeek: !!userMapping ? (anfUserDataMap[userMapping.apiV2Id].removedWeek ?? 0) : 0,
      anfRemovedThisMonth: !!userMapping ? (anfUserDataMap[userMapping.apiV2Id].removedMonth ?? 0) : 0,
      commentsAddedToday: !!userMapping ? (commentUserDataMap[user.id]?.countToday ?? 0) : 0,
      commentsAddedThisWeek: !!userMapping ? (commentUserDataMap[user.id]?.countWeek ?? 0) : 0,
      commentsAddedThisMonth: !!userMapping ? (commentUserDataMap[user.id]?.countMonth ?? 0) : 0,
      avgCommentLengthToday: !!userMapping ? Math.round(commentUserDataMap[user.id]?.avgWordCountToday ?? 0) : 0,
      avgCommentLengthThisWeek: !!userMapping ? Math.round(commentUserDataMap[user.id]?.avgWordCountWeek ?? 0) : 0,
      avgCommentLengthThisMonth: !!userMapping ? Math.round(commentUserDataMap[user.id]?.avgWordCountMonth ?? 0) : 0
    })
  });

  return result;
};

const SpaceItemsPage = async () => {
  const session = await getServerSession(authConfig);
  const isAuthenticated = !!session && (session?.error !== "RefreshAccessTokenError");

  if (!isAuthenticated) {
    redirect('/login');
  }

  const data = await fetchWrikeUsers(session.user?.id);
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
