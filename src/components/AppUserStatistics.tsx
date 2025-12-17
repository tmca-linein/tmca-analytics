import { Badge, Link2, Mail, MapPin, Phone } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";
import { ApiWrikeUser } from "@/types/user";

type AppUserStatisticsProps = {
    taskActivity: Record<string, integer>,
    anfActivity: numeric[],
    commentActivity: numeric[]
}

const AppUserStatistics = (
    props: AppUserStatisticsProps,
) => {
    const { taskActivity, anfActivity, commentActivity } = props;
    const {addedToday, addedWeek, addedMonth, addedTotal, removedToday, removedWeek, removedMonth, removedTotal} = anfActivity;
    const {countToday, countWeek, countMonth, countTotal, avgWordCount} = commentActivity;
    return (
        <div className="flex items-center justify-center bg-muted/30">
            <Card className=" w-full rounded-3xl border shadow-sm">
                <CardContent className="pb-4">
                    <p className="mt-4 text-sm text-muted-foreground">Authored task statistics</p>
                    <div className="grid grid-cols-3 rounded-2xl border bg-muted/40 text-center py-4">
                        <div className="flex flex-col gap-1">
                            <span className="text-base font-semibold">{taskActivity.authoredCreatedTasks}</span>
                            <span className="text-xs text-muted-foreground">Created tasks</span>
                        </div>
                        <div className="flex flex-col gap-1 border-x">
                            <span className="text-base font-semibold">{taskActivity.authoredCompletedTasks}</span>
                            <span className="text-xs text-muted-foreground">Completed tasks</span>
                        </div>
                        <div className="flex flex-col gap-1 border-x">
                            <span className="text-base font-semibold">{taskActivity.authoredActiveTasks}</span>
                            <span className="text-xs text-muted-foreground">Active tasks</span>
                        </div>
                    </div>
                    <p className="mt-4 text-sm text-muted-foreground">Assigned task statistics</p>
                    <div className="grid grid-cols-3 rounded-2xl border bg-muted/40 text-center py-4">
                        <div className="flex flex-col gap-1">
                            <span className="text-base font-semibold">{taskActivity.assignedCreatedTasks}</span>
                            <span className="text-xs text-muted-foreground">Assigned tasks</span>
                        </div>
                        <div className="flex flex-col gap-1 border-x">
                            <span className="text-base font-semibold">{taskActivity.assignedCompletedTasks}</span>
                            <span className="text-xs text-muted-foreground">Completed tasks</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-base font-semibold">{taskActivity.assignedActiveTasks}</span>
                            <span className="text-xs text-muted-foreground">Active tasks</span>
                        </div>
                    </div>
                    <p className="mt-4 text-sm text-muted-foreground">ANF-Added</p>
                    <div className="grid grid-cols-4 rounded-2xl border bg-muted/40 text-center py-4">
                        <div className="flex flex-col gap-1">
                            <span className="text-base font-semibold">{addedToday}</span>
                            <span className="text-xs text-muted-foreground">/day</span>
                        </div>
                        <div className="flex flex-col gap-1 border-x">
                            <span className="text-base font-semibold">{addedWeek}</span>
                            <span className="text-xs text-muted-foreground">/week</span>
                        </div>
                        <div className="flex flex-col gap-1 border-x">
                            <span className="text-base font-semibold">{addedMonth}</span>
                            <span className="text-xs text-muted-foreground">/month</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-base font-semibold">{addedTotal}</span>
                            <span className="text-xs text-muted-foreground">total</span>
                        </div>
                    </div>
                    <p className="mt-4 text-sm text-muted-foreground">ANF-Removed</p>
                    <div className="grid grid-cols-4 rounded-2xl border bg-muted/40 text-center py-4">
                        <div className="flex flex-col gap-1">
                            <span className="text-base font-semibold">{removedToday}</span>
                            <span className="text-xs text-muted-foreground">/day</span>
                        </div>
                        <div className="flex flex-col gap-1 border-x">
                            <span className="text-base font-semibold">{removedWeek}</span>
                            <span className="text-xs text-muted-foreground">/week</span>
                        </div>
                        <div className="flex flex-col gap-1 border-x">
                            <span className="text-base font-semibold">{removedMonth}</span>
                            <span className="text-xs text-muted-foreground">/month</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-base font-semibold">{removedTotal}</span>
                            <span className="text-xs text-muted-foreground">total</span>
                        </div>
                    </div>
                    <p className="mt-4 text-sm text-muted-foreground">Comments</p>
                    <div className="grid grid-cols-5 rounded-2xl border bg-muted/40 text-center py-4">
                        <div className="flex flex-col gap-1">
                            <span className="text-base font-semibold">{countToday}</span>
                            <span className="text-xs text-muted-foreground">/day</span>
                        </div>
                        <div className="flex flex-col gap-1 border-x">
                            <span className="text-base font-semibold">{countWeek}</span>
                            <span className="text-xs text-muted-foreground">/week</span>
                        </div>
                        <div className="flex flex-col gap-1 border-x">
                            <span className="text-base font-semibold">{countMonth}</span>
                            <span className="text-xs text-muted-foreground">/month</span>
                        </div>
                        <div className="flex flex-col gap-1 border-x">
                            <span className="text-base font-semibold">{countTotal}</span>
                            <span className="text-xs text-muted-foreground">total</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-base font-semibold">{Math.round(avgWordCount)}</span>
                            <span className="text-xs text-muted-foreground">Avg commnent length (word)</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export default AppUserStatistics;