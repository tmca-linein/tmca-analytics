"use server"
import { unstable_cache } from "next/cache";
import { axiosRequest, getHeaderConfig } from "./axios";
import { WrikeApiContactsResponse } from "@/types/user";
import { getServerSession } from "next-auth";
import { authConfig } from "./auth";
import { AxiosRequestConfig } from "axios";

async function fetchWrikeAdmin(userId: string, config: AxiosRequestConfig | undefined) {
    const res = await axiosRequest<WrikeApiContactsResponse>("GET", `/users/${userId}`, undefined, config);
    const user = res.data.data?.[0];
    return true;//Boolean(user?.profiles?.some(p => p?.accountId === process.env.ACCOUNT_ID && (p?.admin || p.owner)));
}

const cachedFetchWrikeAdmin = unstable_cache(
    async (userId: string, config: AxiosRequestConfig | undefined) => fetchWrikeAdmin(userId, config),
    [`wrike-admin`],
    { revalidate: 60 * 1 }
);

export async function getAdminStatus() {
    const session = await getServerSession(authConfig);
    if (!session?.user) return { isAdmin: false };
    const userId = session.user.id;
    const config = await getHeaderConfig();
    const isAdmin = await cachedFetchWrikeAdmin(userId, config);
    return { isAdmin };
}
