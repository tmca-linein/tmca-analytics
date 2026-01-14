// app/docs/user-overview-dashboard/page.tsx
// Documentation page for the "User Overview Dashboard" written in TypeScript,
// using shadcn/ui components (based on the previous layout style).
"use client"
import * as React from "react"
import Image from "next/image";

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
    Alert,
    AlertDescription,
    AlertTitle,
} from "@/components/ui/alert"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Info, ShieldAlert, ListChecks } from "lucide-react"

type Section = {
    id: string
    title: string
    plain: string
    whatYouSee: string[]
    whatItsFor: string[]
    tips?: string[]
    image?: string
}

const sections: Section[] = [
    {
        id: "user-profile",
        title: "1) User Profile",
        plain:
            "This area shows basic info so you can confirm you’re looking at the right person.",
        whatYouSee: [
            "Name and profile photo",
            "Job title",
            "Email",
            "Location / timezone",
            "Phone (if available)",
        ],
        whatItsFor: [
            "Confirm you have the correct user",
            "Spot outdated/missing profile details",
        ],
        tips: ["If something looks wrong here, the profile data is outdated."],
    },
    {
        id: "latest-activity",
        title: "2) Latest Activity",
        plain:
            "This is a small activity log showing the most recent actions involving the user.",
        whatYouSee: ["Recent actions", "Timestamps", "System messages"],
        whatItsFor: ["Answer: “What has this user been doing lately?”"],
        tips: [
            "If you see “you are not authorised to view this task”, it means the task exists but you don’t have permission to open it.",
        ],
        image: "/activity.png"
    },
    {
        id: "user-action-items",
        title: "3) User Action Items (IMPORTANT)",
        plain:
            "This is the user’s to-do list. If anything is here, someone is waiting for the user to respond. The list is sorted from longest overdue duration to shortest.",
        whatYouSee: [
            "Task name (may be hidden if you don’t have access)",
            "When action was needed",
            "How overdue it is",
            "Type of actions (e.g., “Answer is needed within 24h!”)",
        ],
        whatItsFor: [
            "Answer: “What does this user still need to do?”",
            "Identify urgent items first",
        ],
        tips: [
            "Red overdue warnings mean that the deadline has passed.",
            "ANF 'ADDED' events have 24h response window.",
            "Overdue duration means: how late it already is.",
        ],
        image: "/action-items.png"
    },
    {
        id: "answer-needed-chart",
        title: "4) “Answer is needed from” Chart",
        plain:
            "This chart shows historical ANF items added/removed over time, like a workload timeline.",
        whatYouSee: ["Time range selector", "Dots/points on a timeline"],
        whatItsFor: [
            "See trends: was the user suddenly assigned many items?",
            "Verify workload changes over time",
        ],
        tips: [
            "(IMPORTANT!) 'ANF-removed' event counts only if a comment was written within 10 minutes of removing user from ANF field.",
            "Added (green) = new requests came in.",
            "Removed (red) = requests were resolved/removed.",
            "Flat chart usually means: not much happened in that period.",
        ],
        image: "/anf-history.png"
    },
    {
        id: "anf-feedback-loop",
        title: "5) ANF Feedback Loop",
        plain:
            "This measures how fast the user responds to ANF events (response time in hours).",
        whatYouSee: [
            "This week / month / quarter breakdown",
            "Average response time",
            "Longest response time",
            "Number of transitions/events",
        ],
        whatItsFor: ["Answer: “Is this user responsive or slow?”"],
        tips: [
            "(IMPORTANT!) 'ANF-removed' event counts only if a comment was written within 10 minutes of removing user from ANF field.",
            "If everything is 0, it usually means there were no relevant events in that period.",
            "Week data will be loaded if there is at least one FULL loop from ANF-added to ANF-removed.",
            "Graph displays data in selected granularity. Data is grouped by a event 'bucket' start date."
        ],
        image: "/feedback_v2.png"
    },
    {
        id: "user-comments",
        title: "6) User Comments",
        plain:
            "This shows comments written by the user (filtered by time range).",
        whatYouSee: ["Time range selector", "A list of user comments (if any)"],
        whatItsFor: [
            "Review communication quality and context",
            "Audits or investigations",
        ],
        tips: [
            "If it’s empty: either no comments were written, or your time range excludes them.",
        ],
        image: "/comments.png"
    },
    {
        id: "user-statistics",
        title: "7) User Statistics",
        plain:
            "This is a simple counts panel: how many ANF (Answer is needed from) items were added/removed and how many comments were made.",
        whatYouSee: [
            "ANF added counts (today / week / month)",
            "ANF removed counts",
            "Comments and average comment length",
        ],
        whatItsFor: ["Answer: “How active is this user overall?”"],
        tips: ["(IMPORTANT!) 'ANF-removed' event counts only if a comment was written within 10 minutes of removing user from ANF field.",
            "Zero values usually mean no activity, not that something is broken."],
        image: "/stats.png"
    },
]

function Toc({ items }: { items: { id: string; title: string }[] }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>On this page</CardTitle>
                <CardDescription>Jump to a section.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
                <div className="grid gap-2">
                    {items.map((i) => (
                        <a
                            key={i.id}
                            href={`#${i.id}`}
                            className="text-sm text-muted-foreground hover:text-foreground"
                        >
                            {i.title}
                        </a>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}

function SectionCard({ section }: { section: Section }) {
    return (
        <Card id={section.id} className="scroll-mt-24">
            <CardHeader className="space-y-1">
                <CardTitle>{section.title}</CardTitle>
                <CardDescription>{section.plain}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        {section.image ? <Image src={section.image} alt="Screenshot" width="2000" height="1000" className="w-full h-auto" /> : undefined}

                    </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <div className="text-sm font-medium">What you see</div>
                        <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                            {section.whatYouSee.map((x) => (
                                <li key={x}>{x}</li>
                            ))}
                        </ul>
                    </div>

                    <div className="space-y-2">
                        <div className="text-sm font-medium">What it’s for</div>
                        <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                            {section.whatItsFor.map((x) => (
                                <li key={x}>{x}</li>
                            ))}
                        </ul>
                    </div>
                </div>

                {section.tips?.length ? (
                    <Alert>
                        <Info className="h-4 w-4" />
                        <AlertTitle>Tip</AlertTitle>
                        <AlertDescription>
                            <ul className="list-disc space-y-1 pl-5">
                                {section.tips.map((t) => (
                                    <li key={t}>{t}</li>
                                ))}
                            </ul>
                        </AlertDescription>
                    </Alert>
                ) : null}
            </CardContent>
        </Card>
    )
}

export default function UserOverviewDashboardDocsPage() {
    const tocItems = sections.map((s) => ({ id: s.id, title: s.title }))

    return (
        <div className="mx-auto w-full max-w-6xl px-4 py-10 md:px-6">
            {/* Header */}
            <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">Docs</Badge>
                    <Badge variant="outline">Dashboard</Badge>
                    <Badge variant="outline">User Overview</Badge>
                </div>

                <h1 className="text-3xl font-semibold tracking-tight">
                    User Overview Dashboard (Explained Simply)
                </h1>
                <p className="max-w-3xl text-muted-foreground">
                    This page tells you: <span className="font-medium">who the user is</span>,{" "}
                    <span className="font-medium">what they’ve been doing</span>,{" "}
                    <span className="font-medium">what they still owe</span>, and{" "}
                    <span className="font-medium">how responsive they are</span>.<br /><br />
                    <span className="font-medium text-red-500">IMPORTANT! Events are tracked in UTC time zone (+0:00)!</span>
                </p>

                <div className="flex flex-wrap gap-2">
                    <Button
                        size="sm"
                        onClick={() =>
                            document
                                .getElementById("user-action-items")
                                ?.scrollIntoView({ behavior: "smooth", block: "start" })
                        }
                    >
                        <ListChecks className="mr-2 h-4 w-4" />
                        Jump to Action Items
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                            document
                                .getElementById("common-questions")
                                ?.scrollIntoView({ behavior: "smooth", block: "start" })
                        }
                    >
                        FAQs
                    </Button>
                </div>
            </div>

            <Separator className="my-8" />

            {/* Intro row */}
            <div className="grid gap-6 md:grid-cols-3">
                <div className="md:col-span-2 space-y-6">

                    <Tabs defaultValue="quick" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="quick">Quick start</TabsTrigger>
                            <TabsTrigger value="deep">Deeper reading</TabsTrigger>
                        </TabsList>

                        <TabsContent value="quick" className="mt-6 space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Quick start (3 checks)</CardTitle>
                                    <CardDescription>
                                        The fastest way to understand what’s going on.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-3">
                                        <div className="flex gap-3">
                                            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border bg-background text-sm font-medium">
                                                1
                                            </div>
                                            <div>
                                                <div className="font-medium">User Action Items</div>
                                                <div className="text-sm text-muted-foreground">
                                                    What they must respond to (urgency).
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-3">
                                            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border bg-background text-sm font-medium">
                                                2
                                            </div>
                                            <div>
                                                <div className="font-medium">Latest Activity</div>
                                                <div className="text-sm text-muted-foreground">
                                                    What happened recently (context).
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-3">
                                            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border bg-background text-sm font-medium">
                                                3
                                            </div>
                                            <div>
                                                <div className="font-medium">ANF Feedback Loop</div>
                                                <div className="text-sm text-muted-foreground">
                                                    How fast they respond (performance).
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <Alert>
                                        <ShieldAlert className="h-4 w-4" />
                                        <AlertTitle>Permission message is normal</AlertTitle>
                                        <AlertDescription>
                                            “You are not authorised to view this task” means the task exists,
                                            but you can’t open its details.
                                        </AlertDescription>
                                    </Alert>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="deep" className="mt-6 space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>How to interpret zeros</CardTitle>
                                    <CardDescription>“0” usually means “no data”.</CardDescription>
                                </CardHeader>
                                <CardContent className="text-sm text-muted-foreground space-y-2">
                                    <p>
                                        If you see 0 for week/month/quarter, it normally means:
                                    </p>
                                    <ul className="list-disc pl-5 space-y-1">
                                        <li>No relevant events happened during that time</li>
                                        <li>Or the user didn’t need to respond to anything</li>
                                    </ul>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>

                <Toc items={tocItems} />
            </div>

            <Separator className="my-10" />

            {/* Main sections */}
            <div className="space-y-6">
                {sections.map((s) => (
                    <SectionCard key={s.id} section={s} />
                ))}
            </div>

            <Separator className="my-10" />

            {/* Common Questions */}
            <Card id="common-questions" className="scroll-mt-24">
                <CardHeader>
                    <CardTitle>Common Questions (FAQ)</CardTitle>
                    <CardDescription>Short answers, no fluff.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="faq-1">
                            <AccordionTrigger>
                                Why do I see “you are not authorised to view this task”?
                            </AccordionTrigger>
                            <AccordionContent className="text-sm text-muted-foreground">
                                Because the task exists, but your role doesn’t allow opening its details.
                                This is expected behavior, not a bug.
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="faq-2">
                            <AccordionTrigger>Does “0” mean something is broken?</AccordionTrigger>
                            <AccordionContent className="text-sm text-muted-foreground">
                                Usually no. It typically means there was no activity / no seeable data
                                in that time period.
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="faq-3">
                            <AccordionTrigger>What should I check first?</AccordionTrigger>
                            <AccordionContent className="text-sm text-muted-foreground">
                                1) User Action Items (urgency), 2) Latest Activity (context), 3) ANF Feedback Loop (responsiveness).
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>

                    <Separator />

                    <Card>
                        <CardHeader>
                            <CardTitle>Cheat sheet</CardTitle>
                            <CardDescription>If you remember nothing else.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Section</TableHead>
                                        <TableHead>Answers this question</TableHead>
                                        <TableHead>When to use it</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    <TableRow>
                                        <TableCell className="font-medium">User Action Items</TableCell>
                                        <TableCell>What must the user do now?</TableCell>
                                        <TableCell>Always check first</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell className="font-medium">Latest Activity</TableCell>
                                        <TableCell>What happened recently?</TableCell>
                                        <TableCell>When you need context</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell className="font-medium">ANF Feedback Loop</TableCell>
                                        <TableCell>How fast do they respond?</TableCell>
                                        <TableCell>When judging responsiveness</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell className="font-medium">User Statistics</TableCell>
                                        <TableCell>How active are they overall?</TableCell>
                                        <TableCell>When you want counts/trends</TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </CardContent>
            </Card>

        </div>
    )
}
