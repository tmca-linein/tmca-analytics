import { NextAuthOptions } from "next-auth";
import { mainAuthConfig } from "./auth.config";
import { getServerSession } from "next-auth";

export const authConfig: NextAuthOptions = {
    // adapter: PrismaAdapter(prisma),
    session: { strategy: "jwt" },
    ...mainAuthConfig
};

export async function requireAuth() {
    const session = await getServerSession(authConfig);
    const isAuthenticated =
        !!session && session?.error !== "RefreshAccessTokenError";

    return { session, isAuthenticated };
}
