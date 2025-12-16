"use client";

import { useMemo, useState } from "react";
import { addDays, isSameDay, startOfDay } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, AlertTriangle } from "lucide-react";

type AttentionItem = {
    id: string;
    title: string;
    description?: string;
    date: Date;
    status: "overdue" | "today" | "upcoming";
    time?: string;
};



type AppCalendarViewProps<TData extends AttentionItem> = {
    title: string
    items: TData[],
}

export function AppCalendarView<TData extends AttentionItem>(
    props: AppCalendarViewProps<TData>,
) {
    const [date, setDate] = useState<Date | undefined>(new Date());
    const items = props.items ?? [];
    // Normalize to start-of-day so equality checks work
    const itemsByDay = useMemo(() => {
        return items.reduce<Record<string, AttentionItem[]>>((acc, item) => {
            const key = startOfDay(item.date).toISOString();
            acc[key] = acc[key] ? [...acc[key], item] : [item];
            return acc;
        }, {});
    }, []);

    const datesWithAttention = useMemo(
        () => Object.keys(itemsByDay).map((iso) => new Date(iso)),
        [itemsByDay]
    );

    const itemsForDay = useMemo(
        () =>
            date
                ? items.filter((item) => isSameDay(item.date, date))
                : [],
        [date]
    );

    return (
        <Card className="w-full rounded-3xl border bg-background">
            <CardHeader className="flex items-center justify-between pb-4">
                <CardTitle className="text-base font-semibold">
                    {props.title}
                </CardTitle>
            </CardHeader>

            <CardContent className="pb-6 w-full">
                <div className="w-full grid gap-6 justify-items-center md:grid-cols-[minmax(0,1fr),minmax(0,1fr)]">
                    {/* Calendar with highlighted days */}
                    <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        className="rounded-2xl border bg-card p-3 text-sm"
                        // Mark days that have at least one item
                        modifiers={{
                            hasAttention: datesWithAttention,
                        }}
                        modifiersClassNames={{
                            hasAttention:
                                // tiny dot under the number
                                "relative after:absolute after:left-1/2 after:bottom-0 after:h-1.5 after:w-1.5 after:-translate-x-1/2 after:rounded-full after:bg-emerald-500",
                        }}
                    />

                    {/* Scrollable list */}
                    <div className="w-full flex flex-col">
                        <div className="mb-3 flex items-center justify-between">
                            <p className="text-sm font-medium">
                                {date?.toLocaleDateString(undefined, {
                                    weekday: "long",
                                    month: "short",
                                    day: "numeric",
                                })}
                            </p>
                            {itemsForDay.length > 0 && (
                                <span className="text-xs text-muted-foreground">
                                    {itemsForDay.length} item
                                    {itemsForDay.length > 1 ? "s" : ""}
                                </span>
                            )}
                        </div>

                        <ScrollArea className="h-64 rounded-2xl border bg-muted/40 p-3">
                            {itemsForDay.length === 0 ? (
                                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                                    Nothing scheduled for this day.
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {itemsForDay.map((item) => (
                                        <div
                                            key={item.id}
                                            className="rounded-2xl bg-background px-3 py-2.5 text-sm shadow-sm"
                                        >
                                            <div className="mb-1 flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-2">
                                                    {item.status === "overdue" && (
                                                        <AlertTriangle className="h-4 w-4 text-red-500" />
                                                    )}
                                                    {item.status === "today" && (
                                                        <Clock className="h-4 w-4 text-amber-500" />
                                                    )}
                                                    {item.status === "upcoming" && (
                                                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                                    )}
                                                    <p className="font-medium">{item.title}</p>
                                                </div>
                                                <Badge
                                                    variant="secondary"
                                                    className="text-[10px] px-2 py-0.5 rounded-full"
                                                >
                                                    {item.status === "overdue" && "Overdue"}
                                                    {item.status === "today" && "Today"}
                                                    {item.status === "upcoming" && "Upcoming"}
                                                </Badge>
                                            </div>

                                            {item.time && (
                                                <p className="mb-1.5 text-xs text-muted-foreground">
                                                    {item.time}
                                                </p>
                                            )}

                                            {item.description && (
                                                <p className="text-xs text-muted-foreground">
                                                    {item.description}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
