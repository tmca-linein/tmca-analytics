import { NextAuthOptions } from "next-auth";
import { mainAuthConfig } from "./auth.config";

export const authConfig: NextAuthOptions = {
    // adapter: PrismaAdapter(prisma),
    session: {strategy: "jwt"},
    ...mainAuthConfig
};
