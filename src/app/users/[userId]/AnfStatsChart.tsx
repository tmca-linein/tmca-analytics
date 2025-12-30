"use client";

import AppAreaChart, { SelectFilterDef } from "@/components/AppAreaChart";

export type AnfStatsRow = { date: string; added: number; removed: number };
const FILTERS: SelectFilterDef<AnfStatsRow>[] = [
    {
        id: "date",
        label: "Period",
        defaultValue: "30d",
        options: [
            { value: "90d", label: "Quarter" },
            { value: "30d", label: "Month" },
            { value: "7d", label: "Week" },
        ],
        apply: (row, value) => {
            const date = new Date(row.date)
            const referenceDate = new Date()
            let daysToSubtract = 90
            if (value === "30d") {
                daysToSubtract = 30
            } else if (value === "7d") {
                daysToSubtract = 7
            }
            const startDate = new Date(referenceDate)
            startDate.setDate(startDate.getDate() - daysToSubtract)
            return date >= startDate
        },
    },
];

export default function AnfStats({ anfData }: { anfData: AnfStatsRow[] }) {
    return (
        <AppAreaChart
            chartTitle='📍Answer is needed from'
            chartDesc="Displays ANF historical data"
            chartData={anfData}
            xKey="date"
            series={[
                { key: "removed", label: "Removed", color: "var(--chart-1)" },
                { key: "added", label: "Added", color: "var(--chart-2)" },
            ]}
            xType="date"
            filters={FILTERS} />
    );
}
