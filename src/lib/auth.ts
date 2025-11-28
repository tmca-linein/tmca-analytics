import { NextAuthOptions } from "next-auth";
import prisma from "./db";
import { PrismaAdapter } from "@auth/prisma-adapter"
import { mainAuthConfig } from "./auth.config";

export const authConfig: NextAuthOptions = {
    // adapter: PrismaAdapter(prisma),
    session: {strategy: "jwt"},
    ...mainAuthConfig
};
