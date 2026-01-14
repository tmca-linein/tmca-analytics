import { UsersTable } from './WrikeUsersTable';
import { getUserIdMapping } from "@/cache/legacyId-cache";
import { fetchBulkANFActivity } from '../../stats/anfRetriever';
import { fetchBulkCommentActivity } from '../../stats/commentsRetriever';
import { getSubordinates } from '@/lib/ug-extractor';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth';

const fetchWrikeUsers = async (userId: string) => {
  const [anfData, commentData] = await Promise.all([
    fetchBulkANFActivity(),
    fetchBulkCommentActivity()
  ]);

  const anfUserDataMap = Object.fromEntries(
    anfData.map(d => [d.assignedUserId, d])
  );

  const commentUserDataMap = Object.fromEntries(
    commentData.map(d => [d.userId, d])
  );

  const userIdsMapping = await getUserIdMapping();
  const users = await getSubordinates(userId);

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
      commentsAddedToday: commentUserDataMap[user.id]?.countToday ?? 0,
      commentsAddedThisWeek: commentUserDataMap[user.id]?.countWeek ?? 0,
      commentsAddedThisMonth: commentUserDataMap[user.id]?.countMonth ?? 0,
      avgCommentLengthToday: Math.round(commentUserDataMap[user.id]?.avgWordCountToday ?? 0),
      avgCommentLengthThisWeek: Math.round(commentUserDataMap[user.id]?.avgWordCountWeek ?? 0),
      avgCommentLengthThisMonth: Math.round(commentUserDataMap[user.id]?.avgWordCountMonth ?? 0)
    })
  });

  return result;
};

const SpaceItemsPage = async () => {
  const session = await getServerSession(authConfig);
  if (!session) return <></>;
  const data = await fetchWrikeUsers(session.user.id);
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
