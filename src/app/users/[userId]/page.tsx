import prisma from '@/lib/db';

import AppAreaChart from "@/components/AppAreaChart";
import { axiosRequest } from "@/lib/axios";
import { WrikeApiContactsResponse } from "@/types/user";
import AppUserDescription from '@/components/AppUserDescription';
import { AppUserActivityWindow } from '@/components/AppUserActivityWindow';
import { AppCalendarView } from '@/components/AppCalendarView';
import { addDays, isSameDay, startOfDay } from "date-fns";
import AppLineChart from '@/components/AppLineChart';


export type AnfEventDailyStats = {
    date: string;
    added: number;
    removed: number;
};

export default async function UserDetailsPage({
    params,
}: {
    params: { userId: string };
}) {
    const { userId } = params;
    const userDetailsResponse = await axiosRequest<WrikeApiContactsResponse>("GET", `/users/${userId}`);
    const userDetails = userDetailsResponse.data.data[0];

    const historicalANFData: AnfEventDailyStats[] = await prisma.$queryRaw`
        SELECT
        TO_CHAR(DATE("eventDate"), 'YYYY-MM-DD') AS date,
        SUM(CASE WHEN "state" = 'ADDED'   THEN 1 ELSE 0 END)::int AS added,
        SUM(CASE WHEN "state" = 'REMOVED' THEN 1 ELSE 0 END)::int AS removed
        FROM "ANFEvent"
        GROUP BY DATE("eventDate")
        ORDER BY DATE("eventDate")
    `;
    const mockItems: AttentionItem[] = [
        {
            id: "1",
            title: "Follow up with Anshan Haso",
            description: "Send recap of yesterday’s meeting and next steps.",
            date: new Date(),
            status: "today",
            time: "10:30 AM",
        },
        {
            id: "2",
            title: "Review Shadcn UI Kit v2.0.0",
            description: "Check changelog and update design tokens if needed.",
            date: new Date(),
            status: "today",
            time: "3:00 PM",
        },
        {
            id: "3",
            title: "Prepare project roadmap",
            description: "Draft Q1 milestones for the Application UI revamp.",
            date: addDays(new Date(), 1),
            status: "upcoming",
            time: "9:00 AM",
        },
        {
            id: "4",
            title: "Reply to client feedback",
            description: "Answer questions about license and support.",
            date: addDays(new Date(), -1),
            status: "overdue",
        },
    ];
    const chartData = [
        { date: "2024-04-01", desktop: 222 },
        { date: "2024-04-02", desktop: 97 },
        { date: "2024-04-03", desktop: 167 },
        { date: "2024-04-04", desktop: 242 },
        { date: "2024-04-05", desktop: 373 },
        { date: "2024-04-06", desktop: 301 },
    ]
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-4 gap-4">
            <div className="bg-primary-foreground p-4 rounded-lg">
                <AppUserDescription user={userDetails} />
            </div>
            <div className="bg-primary-foreground p-4 rounded-lg"><AppUserActivityWindow /></div>
            <div className="bg-primary-foreground p-4 rounded-lg">
                <AppCalendarView title="📍Next Attention Needed" items={mockItems} />
            </div>
            <div className="bg-primary-foreground p-4 rounded-lg">
                <AppCalendarView title="📍Due dates" items={[]} />
            </div>
            <div className="bg-primary-foreground p-4 rounded-lg lg:col-span-2 xl:col-span-1 2xl:col-span-2">
                <AppAreaChart
                    chartTitle='Field activity: 📍 Answer is needed from'
                    chartDesc="Displays ANF historical data"
                    chartData={historicalANFData}
                    xKey="date"
                    series={[
                        { key: "removed", label: "Removed", color: "var(--chart-1)" },
                        { key: "added", label: "Added", color: "var(--chart-2)" },
                    ]}
                    xType="date" />
            </div>
            <div className="bg-primary-foreground p-4 rounded-lg lg:col-span-2 xl:col-span-1 2xl:col-span-2">
                <AppLineChart
                    chartTitle="User comments"
                    chartDesc="Displays historical user activity based on placed comments"
                    chartData={chartData}
                    xKey="date"
                    series={[
                        { key: "desktop", label: "Comments", color: "var(--chart-4)" },
                    ]}
                    xType='date'
                />
            </div>

        </div>
    );
}