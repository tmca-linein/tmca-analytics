"use client";

import { Pin, CalendarPlus, CalendarCheck2, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import clsx from "clsx";
import { ActionItem } from "@/types/stats";

export function AppActionItems(
    props: { items: ActionItem[], type: string },
) {
    return (
        <Card className="h-full w-full rounded-3xl border bg-background">
            {/* Header */}
            <CardHeader className="">
                <CardTitle className="text-lg font-semibold">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                        <span>Action items</span>
                    </div>
                </CardTitle>
                <CardDescription>
                    Displays unresolved {props.type} action items: <br /> 📍Answer is needed from (top 10 longest), 📍Next attention needed from assignee (all), 📍Date that must be finished (all)
                </CardDescription>
            </CardHeader>

            <CardContent className="max-h-[340px] overflow-y-auto pr-2">
                {props.items.length > 0 ? (
                    <div className="divide-y divide-sidebar/50 dark:divide-primary">
                        {props.items.map((item) => {
                            const overdue = item.overdueDuration > 24 ? `${(item.overdueDuration / 24).toFixed(1)} days` : Math.round(item.overdueDuration * 10) / 10;
                            return (
                                <div key={item.id + item.type} className="flex gap-4 py-4">
                                    {/* Icon */}
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full border bg-card shadow-sm">
                                        {item.type === "ANF" ? (
                                            <Pin className="h-4 w-4" />
                                        ) : item.type === "NANFA" ? (
                                            <CalendarPlus className="h-4 w-4" />
                                        ) : (
                                            <CalendarCheck2 className="h-4 w-4" />
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <a href={item.link}>
                                                <h3 className="text-sm font-semibold">{item.title}</h3>
                                            </a>
                                        </div>

                                        <p className="mt-1 text-xs text-muted-foreground">Action needed from: {item.actionNeededFromDate}</p>
                                        <p className="mt-1 text-xs text-muted-foreground">Action needed until: {item.actionNeededUntilDate}</p>
                                        <p className={clsx(
                                            "mt-1 text-xs",
                                            item.overdueDuration > 24
                                                ? "text-red-500"
                                                : "text-muted-foreground"
                                        )}>Overdue duration: {overdue}</p>

                                        <p className="mt-2 text-sm text-foreground leading-snug font-semibold">
                                            {item.description}
                                        </p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    <span className="mt-1 text-xs text-muted-foreground">No alerts.</span>
                )}
            </CardContent>

        </Card>
    );
}
