"use client";

import AppLineChart, { SelectFilterDef } from "@/components/AppLineChart";


export type CommentsRow = { date: string; comments: number };

export default function WrikeChartClient({ data }: { data: CommentsRow[] }) {
    const filters: SelectFilterDef<CommentsRow>[] = [
        {
            id: "timeRange",
            label: "Time range",
            defaultValue: "30d",
            options: [
                { value: "90d", label: "Last 3 months" },
                { value: "30d", label: "Last 30 days" },
                { value: "7d", label: "Last 7 days" },
            ],
            apply: (row, value) => {
                const date = new Date(row.date);
                const now = new Date();
                const days = value === "7d" ? 7 : value === "30d" ? 30 : 90;
                const start = new Date(now);
                start.setDate(start.getDate() - days);
                return date >= start;
            },
        },
    ];

    return (
        <AppLineChart
            chartTitle="💬 User comments"
            chartDesc="Displays historical user activity based on placed comments"
            chartData={data}
            xKey="date"
            xType="date"
            series={[{ key: "comments", label: "Comments", color: "var(--chart-2)" }]}
            filters={filters}
        />
    );
}