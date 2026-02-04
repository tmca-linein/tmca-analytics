import { UsersTable } from './WrikeUsersTable';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth';
import { SessionExpired } from '@/components/AppSessionExpired';
import { fetchUserTableData } from '@/stats/userRetriever';

const SpaceItemsPage = async () => {
  const session = await getServerSession(authConfig);
  if (!session) return <SessionExpired />;
  const data = await fetchUserTableData(session.user.id);
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
