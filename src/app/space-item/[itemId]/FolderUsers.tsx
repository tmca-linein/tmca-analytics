import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { User } from "@/types/user";
import { UsersTable } from "@/app/users/WrikeUsersTable";

const FolderUsers = (
    props: { data: User[], isProject: boolean },
) => {
    const { data, isProject } = props;

    return (
        <div className="h-full flex items-center justify-center">
            <Card className="h-full w-full rounded-3xl border shadow-sm">
                <CardHeader className="flex items-center gap-2 space-y-0 border-b sm:flex-row">
                    <div className="grid flex-1 gap-1">
                        <CardTitle>{isProject ? "Project" : "Folder"} Users</CardTitle>
                        <CardDescription>
                            Users shared within the scope of this {isProject ? "project" : "folder"}. Activity displays the performance within the {isProject ? "project" : "folder"}.
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="pb-4 h-[700px]">
                    <UsersTable initialData={data} spaceUsers={true} />
                </CardContent>
            </Card>
        </div>
    )
}

export default FolderUsers;