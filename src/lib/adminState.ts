"use server"

import { axiosRequest } from "./axios";
import { WrikeApiContactsResponse } from "@/types/user";
import { getServerSession } from "next-auth";
import { authConfig } from "./auth";

async function fetchWrikeAdmin(userId: string) {
    const res = await axiosRequest<WrikeApiContactsResponse>("GET", `/users/${userId}`);
    const user = res.data.data?.[0];
    return Boolean(user?.profiles?.some(p => (p?.accountId === process.env.ACCOUNT_ID) && (p?.admin || p.owner)) || user.id === process.env.DEV_ADMIN);
}

export async function getAdminStatus() {
    const session = await getServerSession(authConfig);
    if (!session?.user) return { isAdmin: false };
    const userId = session.user.id;
    const isAdmin = await fetchWrikeAdmin(userId);
    return { isAdmin };
}
