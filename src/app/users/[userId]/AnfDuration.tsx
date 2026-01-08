"use client";

// import AppLineChart, { SelectFilterDef } from "@/components/AppLineChart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export type AnfDurationRow = { granularity: string; bucket: string, avgduration: number, topfiveavgduration: number, transitions_count: number };
// const FILTERS: SelectFilterDef<AnfDurationRow>[] = [
//     {
//         id: "granularity",
//         label: "Granularity",
//         defaultValue: "week",
//         options: [
//             { value: "quarter", label: "Quarterly" },
//             { value: "month", label: "Monthly" },
//             { value: "week", label: "Weekly" },
//         ],
//         apply: (row, value) => {
//             return row.granularity === value;
//         },
//     },
// ];

export default function AnfDuration({ anfData }: { anfData: AnfDurationRow[] }) {
    const weekData = anfData.filter(ad => ad.granularity === "week")[0];
    const monthData = anfData.filter(ad => ad.granularity === "month")[0];
    const quarterData = anfData.filter(ad => ad.granularity === "quarter")[0];
    return (
        // <AppLineChart
        //     chartTitle="🔁 ANF feedback loop"
        //     chartDesc="Average time (in hours) that took user to respond to the ANF event"
        //     chartData={anfData}
        //     xKey="bucket"
        //     xType="date"
        //     series={[
        //         { key: "avgduration", label: "Avg. feedback loop of all ANF transitions :", color: "var(--chart-4)" },
        //         { key: "topfiveavgduration", label: "Avg. feedback loop of top 5 longest ANF transitions :", color: "var(--chart-1)" }
        //     ]}
        //     filters={FILTERS}
        // />
        <div className="flex items-center justify-center bg-muted/30">
            <Card className=" w-full rounded-3xl border shadow-sm">
                <CardHeader className="flex items-center gap-2 space-y-0 border-b sm:flex-row">
                    <div className="grid flex-1 gap-1">
                        <CardTitle>🔁 ANF feedback loop</CardTitle>
                        <CardDescription>
                            Average time (in hours) that took user to respond to the ANF event
                        </CardDescription>
                    </div>

                </CardHeader>
                <CardContent className="pb-4">
                    <p className="mt-4 text-sm text-muted-foreground">This week</p>
                    <div className="grid grid-cols-3 rounded-2xl border bg-muted/40 text-center py-4">
                        <div className="flex flex-col gap-1">
                            <span className="text-base font-semibold">{weekData?.avgduration ?? 0}</span>
                            <span className="text-xs text-muted-foreground">Avg. duration</span>
                        </div>
                        <div className="flex flex-col gap-1 border-x">
                            <span className="text-base font-semibold">{weekData?.topfiveavgduration ?? 0}</span>
                            <span className="text-xs text-muted-foreground">Top 5 (longest) transition avg. duration</span>
                        </div>
                        <div className="flex flex-col gap-1 border-x">
                            <span className="text-base font-semibold">{weekData?.transitions_count ?? 0}</span>
                            <span className="text-xs text-muted-foreground">Trasition count</span>
                        </div>
                    </div>
                    <p className="mt-4 text-sm text-muted-foreground">This month</p>
                    <div className="grid grid-cols-3 rounded-2xl border bg-muted/40 text-center py-4">
                        <div className="flex flex-col gap-1">
                            <span className="text-base font-semibold">{monthData?.avgduration ?? 0}</span>
                            <span className="text-xs text-muted-foreground">Avg. duration</span>
                        </div>
                        <div className="flex flex-col gap-1 border-x">
                            <span className="text-base font-semibold">{monthData?.topfiveavgduration ?? 0}</span>
                            <span className="text-xs text-muted-foreground">Top 5 (longest) transition avg. duration</span>
                        </div>
                        <div className="flex flex-col gap-1 border-x">
                            <span className="text-base font-semibold">{monthData?.transitions_count ?? 0}</span>
                            <span className="text-xs text-muted-foreground">Trasition count</span>
                        </div>
                    </div>
                    <p className="mt-4 text-sm text-muted-foreground">This quarter</p>
                    <div className="grid grid-cols-3 rounded-2xl border bg-muted/40 text-center py-4">
                        <div className="flex flex-col gap-1">
                            <span className="text-base font-semibold">{quarterData?.avgduration ?? 0}</span>
                            <span className="text-xs text-muted-foreground">Avg. duration</span>
                        </div>
                        <div className="flex flex-col gap-1 border-x">
                            <span className="text-base font-semibold">{quarterData?.topfiveavgduration ?? 0}</span>
                            <span className="text-xs text-muted-foreground">Top 5 (longest) transition avg. duration</span>
                        </div>
                        <div className="flex flex-col gap-1 border-x">
                            <span className="text-base font-semibold">{quarterData?.transitions_count ?? 0}</span>
                            <span className="text-xs text-muted-foreground">Trasition count</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
