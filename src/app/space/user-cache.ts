
import { axiosRequest } from "@/lib/axios";
import { WrikeUserData } from "./types";


const userCache = new Map<string, WrikeUserData | null>();

export async function getUserName(id: string): Promise<string> {
    if (!id) return "";
    if (userCache.has(id)) {
        const u = userCache.get(id)!;
        if (!u) return "";
        return `${u.firstName} ${u.lastName}`;
    }
    const res = await axiosRequest('GET', `/users/${id}`).catch(() => null);
    const user = res?.data?.data?.[0];
    if (!user || user.deleted) {
        userCache.set(id, null);
        return "";
    }
    userCache.set(id, user);
    return `${user.firstName} ${user.lastName}`;
}