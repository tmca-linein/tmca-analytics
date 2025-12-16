"use client";

// import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Package2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

type ActivityItem = {
    id: string;
    title: string;
    version: string;
    date: string;
    description: string;
    latest?: boolean;
    hasDownload?: boolean;
};

const activity: ActivityItem[] = [
    {
        id: "1",
        title: "Shadcn UI Kit Application UI",
        version: "v2.0.0",
        date: "Released on December 2nd, 2025",
        description:
            "Get access to over 20+ pages including a dashboard layout, charts, kanban board, calendar, and pre-order E-commerce & Marketing pages.",
        latest: true,
        hasDownload: true,
    },
    {
        id: "2",
        title: "Shadcn UI Kit Figma",
        version: "v1.3.0",
        date: "Released on December 2nd, 2025",
        description:
            "All of the pages and components are first designed in Figma and we keep parity between the two versions even as we update the project.",
    },
    {
        id: "3",
        title: "Shadcn UI Kit Library",
        version: "v1.2.2",
        date: "Released on December 2nd, 2025",
        description:
            "Get started with dozens of web components and interactive elements built on top of Tailwind CSS.",
    },
    {
        id: "4",
        title: "Shadcn UI Kit Library",
        version: "v1.2.2",
        date: "Released on December 2nd, 2025",
        description:
            "Get started with dozens of web components and interactive elements built on top of Tailwind CSS.",
    }
];

export function AppUserActivityWindow() {
    return (
        <Card className="w-full rounded-3xl border bg-background">
            {/* Header */}
            <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold">
                    Latest Activity
                </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
                {activity.map((item, index) => (
                    <div key={item.id} className="flex gap-4">

                        {/* Timeline column */}
                        <div className="flex flex-col items-center">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full border bg-card shadow-sm">
                                <Package2 className="h-4 w-4" />
                            </div>

                            {/* Connecting vertical line */}
                            {index !== activity.length - 1 && (
                                <div className="mt-1 h-full w-px bg-sidebar/50 dark:bg-primary" />
                            )}
                        </div>

                        {/* Content column */}
                        <div className="flex-1 pb-6">
                            <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-sm font-semibold">
                                    {item.title} {item.version}
                                </h3>
                            </div>

                            <p className="mt-1 text-xs text-muted-foreground">
                                {item.date}
                            </p>

                            <p className="mt-2 text-sm text-muted-foreground leading-snug">
                                {item.description}
                            </p>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
