"use client";

import { Pin, Pencil } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

export type ActivityItem = {
    id: string;
    title: string;
    date: string;
    description: string;
    type: "ANF" | "comment";
    link: string;
};


type AppUserActivityWindowProps = {
    items: ActivityItem[],
}

export function AppUserActivityWindow(
    props: AppUserActivityWindowProps,
) {
    return (
        <Card className="mt-4 w-full rounded-3xl border bg-background">
            {/* Header */}
            <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold">
                    Latest Activity
                </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
                {props.items.length > 0 ? props.items.map((item, index) => (
                    <div key={item.id} className="flex gap-4">

                        {/* Timeline column */}

                        <div className="flex flex-col items-center">

                            <div className="flex h-8 w-8 items-center justify-center rounded-full border bg-card shadow-sm">
                                {item.type === "ANF" ? <Pin className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
                            </div>

                            {/* Connecting vertical line */}
                            {index !== props.items.length - 1 && (
                                <div className="mt-1 h-full w-px bg-sidebar/50 dark:bg-primary" />
                            )}
                        </div>


                        {/* Content column */}
                        <div className="flex-1 pb-6">
                            <div className="flex flex-wrap items-center gap-2">
                                <a href={item.link}>
                                    <h3 className="text-sm font-semibold">
                                        {item.title}
                                    </h3>
                                </a>
                            </div>

                            <p className="mt-1 text-xs text-muted-foreground">
                                {item.date}
                            </p>

                            <p className="mt-2 text-sm text-muted-foreground leading-snug">
                                {item.description}
                            </p>
                        </div>
                    </div>
                )) : <span className="mt-1 text-xs text-muted-foreground">No activity yet.</span>}
            </CardContent>
        </Card>
    );
}
