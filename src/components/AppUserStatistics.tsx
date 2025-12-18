import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { WrikeTask } from "@/types/wrikeItem";

type AppUserStatisticsProps = {
    taskActivity: Record<string, number | WrikeTask[]>,
    anfActivity: Record<string, number>,
    commentActivity: Record<string, number>
}

const AppUserStatistics = (
    props: AppUserStatisticsProps,
) => {
    const { taskActivity, anfActivity, commentActivity } = props;
    const { addedToday, addedWeek, addedMonth, addedTotal, removedToday, removedWeek, removedMonth, removedTotal } = anfActivity;
    const { countToday, countWeek, countMonth, countTotal, avgWordCountToday, avgWordCountWeek, avgWordCountMonth } = commentActivity;
    return (
        <div className="flex items-center justify-center bg-muted/30">
            <Card className=" w-full rounded-3xl border shadow-sm">
                <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
                    <div className="grid flex-1 gap-1">
                        <CardTitle>User statistics</CardTitle>
                        <CardDescription>
                            Displays cumulative performance measures
                        </CardDescription>
                    </div>

                </CardHeader>
                <CardContent className="pb-4">
                    <p className="mt-4 text-sm text-muted-foreground">Authored task statistics</p>
                    <div className="grid grid-cols-3 rounded-2xl border bg-muted/40 text-center py-4">
                        <div className="flex flex-col gap-1">
                            <span className="text-base font-semibold">{taskActivity.authoredCreatedTasks as number}</span>
                            <span className="text-xs text-muted-foreground">Created tasks</span>
                        </div>
                        <div className="flex flex-col gap-1 border-x">
                            <span className="text-base font-semibold">{taskActivity.authoredCompletedTasks as number}</span>
                            <span className="text-xs text-muted-foreground">Completed tasks</span>
                        </div>
                        <div className="flex flex-col gap-1 border-x">
                            <span className="text-base font-semibold">{taskActivity.authoredActiveTasks as number}</span>
                            <span className="text-xs text-muted-foreground">Active tasks</span>
                        </div>
                    </div>
                    <p className="mt-4 text-sm text-muted-foreground">Assigned task statistics</p>
                    <div className="grid grid-cols-3 rounded-2xl border bg-muted/40 text-center py-4">
                        <div className="flex flex-col gap-1">
                            <span className="text-base font-semibold">{taskActivity.assignedCreatedTasks as number}</span>
                            <span className="text-xs text-muted-foreground">Assigned tasks</span>
                        </div>
                        <div className="flex flex-col gap-1 border-x">
                            <span className="text-base font-semibold">{taskActivity.assignedCompletedTasks as number}</span>
                            <span className="text-xs text-muted-foreground">Completed tasks</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-base font-semibold">{taskActivity.assignedActiveTasks as number}</span>
                            <span className="text-xs text-muted-foreground">Active tasks</span>
                        </div>
                    </div>
                    <p className="mt-4 text-sm text-muted-foreground">ANF-Added</p>
                    <div className="grid grid-cols-3 rounded-2xl border bg-muted/40 text-center py-4">
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
                    </div>
                    <p className="mt-4 text-sm text-muted-foreground">ANF-Removed</p>
                    <div className="grid grid-cols-3 rounded-2xl border bg-muted/40 text-center py-4">
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
                    </div>
                    <p className="mt-4 text-sm text-muted-foreground">Comments</p>
                    <div className="grid grid-cols-3 rounded-2xl border bg-muted/40 text-center py-4">
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
                    </div>
                    <p className="mt-4 text-sm text-muted-foreground">Average commnent length (words)</p>
                    <div className="grid grid-cols-3 rounded-2xl border bg-muted/40 text-center py-4">
                        <div className="flex flex-col gap-1">
                            <span className="text-base font-semibold">{Math.round(avgWordCountToday)}</span>
                            <span className="text-xs text-muted-foreground">/day</span>
                        </div>
                        <div className="flex flex-col gap-1 border-x">
                            <span className="text-base font-semibold">{Math.round(avgWordCountWeek)}</span>
                            <span className="text-xs text-muted-foreground">/week</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-base font-semibold">{Math.round(avgWordCountMonth)}</span>
                            <span className="text-xs text-muted-foreground">/month</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export default AppUserStatistics;