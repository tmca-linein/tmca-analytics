"use client"

import * as React from "react"

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    ChartContainer,
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
import { Button } from "../ui/button"
import { SelectFilterDef, SeriesDef } from "@/types/stats"

type AppLineChartProps<TData extends Record<string, string | number>> = {
    chartTitle: string
    chartDesc: string
    chartData: TData[]
    xKey: keyof TData
    series: SeriesDef<TData>[]
    heightClassName?: string
    xType?: "string" | "date";
    filters?: SelectFilterDef<TData>[];
    switchState?: boolean;
    onSwitch?: React.Dispatch<React.SetStateAction<boolean>>;
    switchText?: string;
}

function AppLineChart<TData extends Record<string, string | number>>(
    props: AppLineChartProps<TData>,
) {
    const {
        chartTitle,
        chartDesc,
        chartData,
        xKey,
        series,
        heightClassName = "h-[400px]",
        xType,
        filters = [],
        switchState,
        onSwitch,
        switchText
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
    }, [series]);

    const initialFiltersState = React.useMemo(() => {
        const state: Record<string, string> = {};
        for (const f of filters) state[f.id] = f.defaultValue;
        return state;
    }, [filters]);

    const [filterState, setFilterState] = React.useState<Record<string, string>>(
        initialFiltersState,
    );

    React.useEffect(() => {
        setFilterState(initialFiltersState);
    }, [initialFiltersState]);

    const visibleFilters = React.useMemo(
        () => filters.filter((f) => !f.hidden?.(chartData)),
        [filters, chartData],
    );

    const filteredData = React.useMemo(() => {
        if (visibleFilters.length === 0) return chartData;

        return chartData.filter((row) =>
            visibleFilters.every((f) =>
                f.apply(row, filterState[f.id] ?? f.defaultValue, chartData),
            ),
        );
    }, [chartData, visibleFilters, filterState]);


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
                    <div className="flex gap-2 sm:ml-auto">
                        {visibleFilters.map((f) => (
                            <div key={f.id} className="flex gap-2">
                                <span className="inline-flex items-center text-sm text-muted-foreground">{f.label}</span>
                                <Select
                                    value={filterState[f.id] ?? f.defaultValue}
                                    onValueChange={(val) => {
                                        setFilterState((prev) => ({ ...prev, [f.id]: val }))
                                    }
                                    }
                                >
                                    <SelectTrigger
                                        className={
                                            f.triggerClassName ??
                                            "hidden w-[180px] rounded-lg sm:flex"
                                        }
                                        aria-label={f.label}
                                    >
                                        <SelectValue placeholder={f.label} />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                        {f.options.map((opt) => (
                                            <SelectItem
                                                key={opt.value}
                                                value={opt.value}
                                                className="rounded-lg"
                                            >
                                                {opt.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {!!switchState && !!onSwitch ?
                                    <Button
                                        onClick={() => onSwitch(!switchState)}
                                        className="flex items-center font-semibold justify-center h-9 px-5 bg-sidebar transition-colors duration-300 rounded-lg focus:shadow-outline hover:bg-sidebar/90" >
                                        {switchText}
                                    </Button> : undefined}
                            </div>
                        ))}
                    </div>
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
                            <YAxis
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                                width={40}
                                domain={["auto", "auto"]}
                                padding={{ top: 36, bottom: 36 }}
                            />
                            <ChartTooltip
                                cursor={false}
                                content={<ChartTooltipContent hideLabel />}
                            />
                            {series.map(s => (
                                <Line
                                    key={s.key as string}
                                    dataKey={s.key as string}
                                    type="natural"
                                    stroke={`var(--color-${s.key as string})`}
                                    strokeWidth={2}
                                    dot={false}
                                />)
                            )}

                        </LineChart>
                    </ChartContainer>
                </CardContent>
            </Card>
        </div>
    )
}

export default AppLineChart;