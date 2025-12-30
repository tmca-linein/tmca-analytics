import { Mail, MapPin, Phone } from "lucide-react";
import { Card, CardContent, CardHeader } from "../../../components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";
import { ApiWrikeUser } from "@/types/user";


const UserDescription = (
    props: { user: ApiWrikeUser },
) => {
    const { user } = props;
    return (
        <div className="h-full flex items-center justify-center">
            <Card className="h-full w-full rounded-3xl border shadow-sm">
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
                </CardContent>
            </Card>
        </div>
    )
}

export default UserDescription;