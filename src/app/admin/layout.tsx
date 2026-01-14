import { getAdminStatus } from "@/lib/adminState";
import { SessionExpired } from "@/components/AppSessionExpired";
import { requireAuth } from "@/lib/auth";
import { redirect } from "next/navigation";


export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    const { isAuthenticated } = await requireAuth();
    if (!isAuthenticated) return <SessionExpired />;

    const { isAdmin } = await getAdminStatus();
    if (!isAdmin) redirect("/404");

    return <>{children}</>;
}
