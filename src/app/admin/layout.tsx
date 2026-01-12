import { getAdminStatus } from "@/lib/adminState";
import { redirect } from "next/navigation";


export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    const { isAdmin } = await getAdminStatus();

    if (!isAdmin) redirect("/404");

    return <>{children}</>;
}
