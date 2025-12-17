"use client"

import * as React from "react"

import { CartesianGrid, Line, LineChart, XAxis } from "recharts"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

type SeriesDef<T> = {
    key: keyof T
    label: string
    color?: string
}

type AppAreaChartProps<TData extends Record<string, string | number>> = {
    chartTitle: string
    chartDesc: string
    chartData: TData[]
    xKey: keyof TData
    series: SeriesDef<TData>[]
    heightClassName?: string
    xType?: "string" | "date";
}

function AppLineChart<TData extends Record<string, string | number>>(
    props: AppAreaChartProps<TData>,
) {
    const {
        chartTitle,
        chartDesc,
        chartData,
        xKey,
        series,
        heightClassName = "h-[300px]",
        xType,
    } = props

    const chartConfig: ChartConfig = React.useMemo(() => {
        const cfg: ChartConfig = {}
        for (const s of series) {
            const key = String(s.key)
            cfg[key] = {
                label: s.label,
                color: s.color,
            }
        }
        return cfg
    }, [series])
    const [timeRange, setTimeRange] = React.useState("90d")
    const filteredData = chartData.filter((item) => {
        const date = new Date(item.date)
        const referenceDate = new Date()
        let daysToSubtract = 90
        if (timeRange === "30d") {
            daysToSubtract = 30
        } else if (timeRange === "7d") {
            daysToSubtract = 7
        }
        const startDate = new Date(referenceDate)
        startDate.setDate(startDate.getDate() - daysToSubtract)
        return date >= startDate
    })


    return (
        <div className="flex-1">
            <Card className="pt-0">
                <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
                    <div className="grid flex-1 gap-1">
                        <CardTitle>{chartTitle}</CardTitle>
                        <CardDescription>
                            {chartDesc}
                        </CardDescription>
                    </div>
                    <Select value={timeRange} onValueChange={setTimeRange}>
                        <SelectTrigger
                            className="hidden w-[160px] rounded-lg sm:ml-auto sm:flex"
                            aria-label="Select a value"
                        >
                            <SelectValue placeholder="Last 3 months" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                            <SelectItem value="90d" className="rounded-lg">
                                Last 3 months
                            </SelectItem>
                            <SelectItem value="30d" className="rounded-lg">
                                Last 30 days
                            </SelectItem>
                            <SelectItem value="7d" className="rounded-lg">
                                Last 7 days
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </CardHeader>
                <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
                    <ChartContainer
                        config={chartConfig}
                        className={`${heightClassName} w-full`}
                    >
                        <LineChart
                            accessibilityLayer
                            data={filteredData}
                            margin={{
                                left: 12,
                                right: 12,
                            }}
                        >
                            <CartesianGrid vertical={false} />
                            <XAxis
                                dataKey={xKey as string}
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                                tickFormatter={(value) => {
                                    if (xType === "date") {
                                        const d = new Date(value as string);
                                        return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                                    }
                                    return String(value);
                                }}
                            />
                            <ChartTooltip
                                cursor={false}
                                content={<ChartTooltipContent hideLabel />}
                            />
                            <Line
                                dataKey="desktop"
                                type="natural"
                                stroke="var(--color-desktop)"
                                strokeWidth={2}
                                dot={false}
                            />
                        </LineChart>
                    </ChartContainer>
                </CardContent>
            </Card>
        </div>
    )
}

export default AppLineChart;