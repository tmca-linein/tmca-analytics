"use client";

import AppLineChart, { SelectFilterDef } from "@/components/AppLineChart";

export type AnfDurationRow = { granularity: string; bucket: string, avgduration: number, topfiveavgduration: number, transitions_count: number };
const FILTERS: SelectFilterDef<AnfDurationRow>[] = [
    {
        id: "granularity",
        label: "Granularity",
        defaultValue: "week",
        options: [
            { value: "quarter", label: "Quarterly" },
            { value: "month", label: "Monthly" },
            { value: "week", label: "Weekly" },
        ],
        apply: (row, value) => {
            return row.granularity === value;
        },
    },
];

export default function AnfDuration({ anfData }: { anfData: AnfDurationRow[] }) {
    return (
        <AppLineChart
            chartTitle="🔁 ANF feedback loop"
            chartDesc="Average time (in hours) that took user to respond to the ANF event"
            chartData={anfData}
            xKey="bucket"
            xType="date"
            series={[
                { key: "avgduration", label: "Avg. feedback loop of all ANF transitions :", color: "var(--chart-4)" },
                { key: "topfiveavgduration", label: "Avg. feedback loop of top 5 longest ANF transitions :", color: "var(--chart-1)" }
            ]}
            filters={FILTERS}
        />
    );
}
