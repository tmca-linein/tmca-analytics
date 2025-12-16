import { Badge, Link2, Mail, MapPin, Phone } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";
import { ApiWrikeUser } from "@/types/user";


const AppUserDescription = (props: ApiWrikeUser) => {
    const { user } = props
    return (
        <div className="flex items-center justify-center bg-muted/30">
            <Card className=" w-full rounded-3xl border shadow-sm">
                {/* Top section: avatar + name + role */}
                <CardHeader className="flex flex-col items-center gap-3 pb-6 pt-8">
                    <Avatar className="h-20 w-20">
                        <AvatarImage src={user.avatarUrl} alt={`${user.firstName} ${user.lastName}`} className="rounded-full" />
                        <AvatarFallback>{user.firstName[0] + user.lastName[0]}</AvatarFallback>
                    </Avatar>

                    <div className="flex items-center gap-2">
                        <h2 className="text-xl font-semibold">{user.firstName} {user.lastName}</h2>
                    </div>

                    <p className="text-sm text-muted-foreground">{user.title}</p>
                </CardHeader>

                <CardContent className="pb-4">
                    {/* Contact info */}
                    <div className="space-y-3 text-sm text-center">
                        <div className="flex items-center justify-center gap-3">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span>{user.primaryEmail}</span>
                        </div>
                        <div className="flex items-center justify-center gap-3">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span>{user.timezone}</span>
                        </div>
                        <div className="flex items-center justify-center gap-3">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span>Not specified</span>
                        </div>

                    </div>

                    {/* Stats bar */}
                    <p className="mt-4 text-sm text-muted-foreground">General statistics</p>
                    <div className="grid grid-cols-4 rounded-2xl border bg-muted/40 text-center py-4">
                        <div className="flex flex-col gap-1">
                            <span className="text-base font-semibold">184</span>
                            <span className="text-xs text-muted-foreground">Created projects</span>
                        </div>
                        <div className="flex flex-col gap-1 border-x">
                            <span className="text-base font-semibold">32</span>
                            <span className="text-xs text-muted-foreground">Created tasks</span>
                        </div>
                        <div className="flex flex-col gap-1 border-x">
                            <span className="text-base font-semibold">32</span>
                            <span className="text-xs text-muted-foreground">Total comments</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-base font-semibold">32 words</span>
                            <span className="text-xs text-muted-foreground">Avg comment length</span>
                        </div>
                    </div>
                    <p className="mt-4 text-sm text-muted-foreground">ANF-Added</p>
                    <div className="grid grid-cols-3 rounded-2xl border bg-muted/40 text-center py-4">
                        <div className="flex flex-col gap-1">
                            <span className="text-base font-semibold">184</span>
                            <span className="text-xs text-muted-foreground">/day</span>
                        </div>
                        <div className="flex flex-col gap-1 border-x">
                            <span className="text-base font-semibold">32</span>
                            <span className="text-xs text-muted-foreground">/week</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-base font-semibold">32</span>
                            <span className="text-xs text-muted-foreground">/month</span>
                        </div>
                    </div>
                    <p className="mt-4 text-sm text-muted-foreground">ANF-Removed</p>
                    <div className="grid grid-cols-3 rounded-2xl border bg-muted/40 text-center py-4">
                        <div className="flex flex-col gap-1">
                            <span className="text-base font-semibold">184</span>
                            <span className="text-xs text-muted-foreground">/day</span>
                        </div>
                        <div className="flex flex-col gap-1 border-x">
                            <span className="text-base font-semibold">32</span>
                            <span className="text-xs text-muted-foreground">/week</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-base font-semibold">32</span>
                            <span className="text-xs text-muted-foreground">/month</span>
                        </div>
                    </div>


                </CardContent>
            </Card>
        </div>
    )
}

export default AppUserDescription;