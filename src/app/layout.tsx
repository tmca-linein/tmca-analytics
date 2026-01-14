import type { Metadata } from "next";
import "./globals.css";
import AppSidebar from "@/components/AppSidebar";
import Navbar from "@/components/Navbar";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { SidebarProvider } from "@/components/ui/sidebar";
import { cookies } from "next/headers";
import { NextAuthProvider } from "./providers";
import { requireAuth } from "@/lib/auth"
import { getAdminStatus } from "@/lib/adminState";

export const metadata: Metadata = {
  title: "TMCA Buddy",
  description: "TMCA internal analytics app",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies()
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true"

  const { isAuthenticated } = await requireAuth();

  // If not logged in → show ONLY children (login page)
  if (!isAuthenticated) {
    return (
      <html lang="en">
        <NextAuthProvider>
          <body>{children}</body>
        </NextAuthProvider>
      </html>
    );
  }

  const { isAdmin } = await getAdminStatus();

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={` antialiased flex h-screen`}
      >
        <NextAuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <SidebarProvider defaultOpen={defaultOpen}>
              <AppSidebar isAdmin={isAdmin} />
              <main className="flex-1 flex flex-col overflow-hidden">
                <Navbar />
                <div className="flex-1 overflow-auto min-w-0 min-h-0">
                  <div className="flex flex-col h-full p-4 pb-8">
                    {children}
                  </div>
                </div>
              </main>
            </SidebarProvider>
          </ThemeProvider>
        </NextAuthProvider>
      </body>
    </html >
  );
}
