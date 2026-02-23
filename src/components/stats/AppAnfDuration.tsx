"use client";

import AppLineChart from "@/components/stats/AppLineChart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { sameMoment, startOfLastMonthUTC, startOfMonthUTC, startOfWeekMondayUTC } from "@/lib/utils";
import { ANFDuration, SelectFilterDef } from "@/types/stats";
import { useState } from "react";


const FILTERS: SelectFilterDef<ANFDuration>[] = [
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

export default function AnfDuration({ anfData }: { anfData: ANFDuration[] }) {
    const weekData = anfData.find(ad => (ad.granularity === "week") && (sameMoment(ad.bucket, startOfWeekMondayUTC().toISOString())));
    const monthData = anfData.find(ad => (ad.granularity === "month") && (sameMoment(ad.bucket, startOfMonthUTC().toISOString())));
    const lastMonthData = anfData.find(ad => (ad.granularity === "month") && (sameMoment(ad.bucket, startOfLastMonthUTC().toISOString())));
    const [useGraph, setUseGraph] = useState(false);
    const comp = useGraph ? (
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
            switchState={useGraph}
            onSwitch={setUseGraph}
            switchText="Switch to latest data"
        />
    ) :
        (
            <div className="flex items-center justify-center bg-muted/30">
                <Card className=" w-full rounded-3xl border shadow-sm">
                    <CardHeader className="flex items-center gap-2 space-y-0 border-b sm:flex-row">
                        <div className="grid flex-1 gap-1">
                            <CardTitle>🔁 ANF feedback loop</CardTitle>
                            <CardDescription>
                                Average time (in hours) that took user to respond to the ANF event
                            </CardDescription>
                        </div>
                        {/* <div className="flex gap-2 sm:ml-auto">
                            <div className="flex gap-2">
                                <Button
                                    onClick={() => setUseGraph(!useGraph)}
                                    className="flex items-center font-semibold justify-center h-9 px-5 bg-sidebar transition-colors duration-300 rounded-lg focus:shadow-outline hover:bg-sidebar/90" >
                                    Switch to historical data
                                </Button>
                            </div>
                        </div> */}
                    </CardHeader>
                    <CardContent className="pb-4">
                        <p className="mt-4 text-sm text-muted-foreground">This week</p>
                        <div className="grid grid-cols-5 rounded-2xl border bg-muted/40 text-center py-4">
                            <div className="flex flex-col gap-1">
                                <span className="text-base font-semibold">{weekData?.avgduration ?? 0}</span>
                                <span className="text-xs text-muted-foreground">Avg. duration (h)</span>
                            </div>
                            <div className="flex flex-col gap-1 border-x">
                                <span className="text-base font-semibold">{weekData?.topfiveavgduration ?? 0}</span>
                                <span className="text-xs text-muted-foreground">Avg. duration (h) of top 5 (longest) transitions</span>
                            </div>
                            <div className="flex flex-col gap-1 border-x">
                                <span className="text-base font-semibold">{weekData?.transitions_count ?? 0}</span>
                                <span className="text-xs text-muted-foreground">Transition count</span>
                            </div>
                            <div className="flex flex-col gap-1 border-x">
                                <span className="text-base font-semibold">{weekData?.overdue_count ?? 0}</span>
                                <span className="text-xs text-muted-foreground">Overdue transition count</span>
                            </div>
                            <div className="flex flex-col gap-1 ">
                                <span className="text-base font-semibold">{weekData?.avgoverduehours ?? 0}</span>
                                <span className="text-xs text-muted-foreground">Overdue avg. duration</span>
                            </div>
                        </div>
                        <p className="mt-4 text-sm text-muted-foreground">This month</p>
                        <div className="grid grid-cols-5 rounded-2xl border bg-muted/40 text-center py-4">
                            <div className="flex flex-col gap-1">
                                <span className="text-base font-semibold">{monthData?.avgduration ?? 0}</span>
                                <span className="text-xs text-muted-foreground">Avg. duration (h)</span>
                            </div>
                            <div className="flex flex-col gap-1 border-x">
                                <span className="text-base font-semibold">{monthData?.topfiveavgduration ?? 0}</span>
                                <span className="text-xs text-muted-foreground">Avg. duration (h) of top 5 (longest) transitions</span>
                            </div>
                            <div className="flex flex-col gap-1 border-x">
                                <span className="text-base font-semibold">{monthData?.transitions_count ?? 0}</span>
                                <span className="text-xs text-muted-foreground">Transition count</span>
                            </div>
                            <div className="flex flex-col gap-1 border-x">
                                <span className="text-base font-semibold">{monthData?.overdue_count ?? 0}</span>
                                <span className="text-xs text-muted-foreground">Overdue transition count</span>
                            </div>
                            <div className="flex flex-col gap-1 ">
                                <span className="text-base font-semibold">{monthData?.avgoverduehours ?? 0}</span>
                                <span className="text-xs text-muted-foreground">Overdue avg. duration</span>
                            </div>
                        </div>
                        <p className="mt-4 text-sm text-muted-foreground">Last month</p>
                        <div className="grid grid-cols-5 rounded-2xl border bg-muted/40 text-center py-4">
                            <div className="flex flex-col gap-1">
                                <span className="text-base font-semibold">{lastMonthData?.avgduration ?? 0}</span>
                                <span className="text-xs text-muted-foreground">Avg. duration (h)</span>
                            </div>
                            <div className="flex flex-col gap-1 border-x">
                                <span className="text-base font-semibold">{lastMonthData?.topfiveavgduration ?? 0}</span>
                                <span className="text-xs text-muted-foreground">Avg. duration (h) of top 5 (longest) transitions</span>
                            </div>
                            <div className="flex flex-col gap-1 border-x">
                                <span className="text-base font-semibold">{lastMonthData?.transitions_count ?? 0}</span>
                                <span className="text-xs text-muted-foreground">Transition count</span>
                            </div>
                            <div className="flex flex-col gap-1 border-x">
                                <span className="text-base font-semibold">{lastMonthData?.overdue_count ?? 0}</span>
                                <span className="text-xs text-muted-foreground">Overdue transition count</span>
                            </div>
                            <div className="flex flex-col gap-1 ">
                                <span className="text-base font-semibold">{lastMonthData?.avgoverduehours ?? 0}</span>
                                <span className="text-xs text-muted-foreground">Overdue avg. duration</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );

    return comp;
}
