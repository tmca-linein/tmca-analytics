import { SessionExpired } from "@/components/AppSessionExpired";
import { requireAuth } from "@/lib/auth";

export default async function Layout({ children }: { children: React.ReactNode }) {
    const { isAuthenticated } = await requireAuth();
    if (!isAuthenticated) return <SessionExpired />;
    return <>{children}</>;
}
