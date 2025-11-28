import prisma from '@/lib/db';
import { startOfDay, startOfWeek, startOfMonth, endOfDay, endOfMonth, endOfWeek } from 'date-fns';
import { UsersTable } from './WrikeUsersTable';

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
  const users = await prisma.wrikeUser.findMany({
    select: {
      id: true,
      firstName: true,
      lastName: true,
      primaryEmail: true,
      deleted: true
    },
  });

  const result = users.filter(u=> !u.deleted).map(user => ({
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    primaryEmail: user.primaryEmail,
    anfAddedToday: addedTodayMap[user.id] ?? 0,
    anfAddedThisWeek: addedWeekMap[user.id] ?? 0,
    anfAddedThisMonth: addedMonthMap[user.id] ?? 0,

    anfRemovedToday: removedTodayMap[user.id] ?? 0,
    anfRemovedThisWeek: removedWeekMap[user.id] ?? 0,
    anfRemovedThisMonth: removedMonthMap[user.id] ?? 0,

  }));

  return result;
};


const SpaceItemsPage = async () => {
  const data = await fetchWrikeUsers();
  console.log('Users: Current runtime:', process.env.NEXT_RUNTIME); // 'edge' or 'nodejs'

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
