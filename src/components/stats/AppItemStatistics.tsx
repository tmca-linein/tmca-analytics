import { UserANFActivity, UserCommentActivity } from "@/types/stats";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";

type StatisticsProps = {
    title: string;
    anfActivity: UserANFActivity,
    commentActivity: UserCommentActivity
}

const AppItemStatistics = (
    props: StatisticsProps,
) => {
    const { title, anfActivity, commentActivity } = props;
    const { addedDay, addedWeek, addedMonth, addedLastMonth, removedDay, removedWeek, removedMonth, removedLastMonth } = anfActivity;
    const { countDay, countWeek, countMonth, countLastMonth, avgWordCountDay, avgWordCountWeek, avgWordCountMonth, avgWordCountLastMonth } = commentActivity;
    return (
        <div className="flex items-center justify-center bg-muted/30">
            <Card className=" w-full rounded-3xl border shadow-sm">
                <CardHeader className="flex items-center gap-2 space-y-0 border-b sm:flex-row">
                    <div className="grid flex-1 gap-1">
                        <CardTitle>📈 {title}</CardTitle>
                        <CardDescription>
                            Displays cumulative performance measures
                        </CardDescription>
                    </div>

                </CardHeader>
                <CardContent className="pb-4">
                    <p className="mt-4 text-sm text-muted-foreground">ANF-Added</p>
                    <div className="grid grid-cols-4 rounded-2xl border bg-muted/40 text-center py-4">
                        <div className="flex flex-col gap-1">
                            <span className="text-base font-semibold">{addedDay ?? 0}</span>
                            <span className="text-xs text-muted-foreground">/today</span>
                        </div>
                        <div className="flex flex-col gap-1 border-x">
                            <span className="text-base font-semibold">{addedWeek ?? 0}</span>
                            <span className="text-xs text-muted-foreground">/this week</span>
                        </div>
                        <div className="flex flex-col gap-1 border-x">
                            <span className="text-base font-semibold">{addedMonth ?? 0}</span>
                            <span className="text-xs text-muted-foreground">/this month</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-base font-semibold">{addedLastMonth ?? 0}</span>
                            <span className="text-xs text-muted-foreground">/last month</span>
                        </div>
                    </div>
                    <p className="mt-4 text-sm text-muted-foreground">ANF-Removed</p>
                    <div className="grid grid-cols-4 rounded-2xl border bg-muted/40 text-center py-4">
                        <div className="flex flex-col gap-1">
                            <span className="text-base font-semibold">{removedDay ?? 0}</span>
                            <span className="text-xs text-muted-foreground">/today</span>
                        </div>
                        <div className="flex flex-col gap-1 border-x">
                            <span className="text-base font-semibold">{removedWeek ?? 0}</span>
                            <span className="text-xs text-muted-foreground">/this week</span>
                        </div>
                        <div className="flex flex-col gap-1 border-x">
                            <span className="text-base font-semibold">{removedMonth ?? 0}</span>
                            <span className="text-xs text-muted-foreground">/this month</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-base font-semibold">{removedLastMonth ?? 0}</span>
                            <span className="text-xs text-muted-foreground">/last month</span>
                        </div>
                    </div>
                    <p className="mt-4 text-sm text-muted-foreground">Comments</p>
                    <div className="grid grid-cols-4 rounded-2xl border bg-muted/40 text-center py-4">
                        <div className="flex flex-col gap-1">
                            <span className="text-base font-semibold">{countDay ?? 0}</span>
                            <span className="text-xs text-muted-foreground">/today</span>
                        </div>
                        <div className="flex flex-col gap-1 border-x">
                            <span className="text-base font-semibold">{countWeek ?? 0}</span>
                            <span className="text-xs text-muted-foreground">/this week</span>
                        </div>
                        <div className="flex flex-col gap-1 border-x">
                            <span className="text-base font-semibold">{countMonth ?? 0}</span>
                            <span className="text-xs text-muted-foreground">/this month</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-base font-semibold">{countLastMonth ?? 0}</span>
                            <span className="text-xs text-muted-foreground">/last month</span>
                        </div>
                    </div>
                    <p className="mt-4 text-sm text-muted-foreground">Average comment length (words)</p>
                    <div className="grid grid-cols-4 rounded-2xl border bg-muted/40 text-center py-4">
                        <div className="flex flex-col gap-1">
                            <span className="text-base font-semibold">{Math.round(avgWordCountDay) ?? 0}</span>
                            <span className="text-xs text-muted-foreground">/today</span>
                        </div>
                        <div className="flex flex-col gap-1 border-x">
                            <span className="text-base font-semibold">{Math.round(avgWordCountWeek) ?? 0}</span>
                            <span className="text-xs text-muted-foreground">/this week</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-base font-semibold">{Math.round(avgWordCountMonth) ?? 0}</span>
                            <span className="text-xs text-muted-foreground">/this month</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-base font-semibold">{Math.round(avgWordCountLastMonth) ?? 0}</span>
                            <span className="text-xs text-muted-foreground">/last month</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export default AppItemStatistics;