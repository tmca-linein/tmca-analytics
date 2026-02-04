import { getSubordinates } from "@/cache/ug-cache";
import { SessionExpired } from "@/components/AppSessionExpired";
import { requireAuth } from "@/lib/auth";
import { redirect } from "next/navigation";


export default async function UserDetailsLayout({ children, params }: { children: React.ReactNode; params: Promise<{ userId: string }>; }) {
    const { userId } = await params;
    const { isAuthenticated, session } = await requireAuth();
    if (!isAuthenticated) return <SessionExpired />;
    if (!session) redirect("/404");

    const subordinates = await getSubordinates(session.user.id);
    const shouldLoad = subordinates.filter(s => s.id === userId).length > 0 || userId === session.user.id;
    if (!shouldLoad) redirect("/404");

    return <>{children}</>;
}
