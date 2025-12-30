
import { axiosRequest } from "@/lib/axios";
import { WrikeApiContactsResponse, WrikeApiUserGroupResponse } from "@/types/user";
import axios, { AxiosError } from "axios";
import { redirect } from "next/navigation";

const userCache = new Map<string, string>();
const inflight = new Map<string, Promise<string>>();
const parentByChild = new Map<string, string[]>();
const ancestorsCache = new Map<string, string[]>();
const TTL_MS = 60 * 60 * 1000;
let ugCacheExpires: number;

type HttpStatus = number;

interface AxiosLikeError {
    response?: {
        status?: HttpStatus;
        headers?: Record<string, string | string[] | undefined>;
        data?: unknown;
    };
}

function isAxiosLikeError(e: unknown): e is AxiosLikeError {
    return typeof e === "object" && e !== null && "response" in e;
}

function getStatus(e: unknown): HttpStatus | undefined {
    if (!isAxiosLikeError(e)) return undefined;
    const s = e.response?.status;
    return typeof s === "number" ? s : undefined;
}

function isNotFound(e: unknown): boolean {
    return getStatus(e) === 404 || getStatus(e) === 400;
}

function isRetryable(e: unknown): boolean {
    const s = getStatus(e);
    // undefined status = network / no response -> retryable
    return s === 429 || (typeof s === "number" && s >= 500) || s === undefined;
}

async function fetchUserDisplayName(id: string): Promise<string | null> {
    try {
        const res = await axiosRequest<WrikeApiContactsResponse>("GET", `/users/${id}`);
        const user = res?.data?.data?.[0];
        if (!user || user.deleted) return ""; // known "empty"
        return `${user.firstName} ${user.lastName}`;
    } catch (e: unknown) {
        if (isNotFound(e)) return null;
        if (isRetryable(e)) throw e;
        return null;
    }
}

async function fetchGroupDisplayName(id: string): Promise<string> {
    const res = await axiosRequest<WrikeApiUserGroupResponse>("GET", `/groups/${id}`);
    const group = res?.data?.data?.[0];
    const name = group?.title ?? "";
    return name;
}

export async function getUserName(id: string): Promise<string> {
    if (!id) return "";

    const cached = userCache.get(id);
    if (cached !== undefined) return cached;

    const pending = inflight.get(id);
    if (pending) return pending;

    const p = (async (): Promise<string> => {
        try {
            // 1 - user fallback
            const userNameOrNull = await fetchUserDisplayName(id);
            if (userNameOrNull !== null) {
                userCache.set(id, userNameOrNull);
                return userNameOrNull;
            }

            // 2 - group fallback
            const groupName = await fetchGroupDisplayName(id);
            if (groupName !== "") userCache.set(id, groupName);
            return groupName;
        } catch {
            // transient failures (429/5xx/network): don't cache
            return "";
        } finally {
            inflight.delete(id);
        }
    })();

    inflight.set(id, p);
    return p;
}

export async function cacheAncestorMappings() {
    const now = Date.now();

    if (!!ugCacheExpires && ugCacheExpires > now)
        return; // cache is valid

    // update cache with latest data
    parentByChild.clear();
    const res = await axiosRequest<WrikeApiUserGroupResponse>("GET", `/groups`);
    if (!res) return; // don't cache network failures
    const groups = res?.data?.data;

    // build relationship tree
    for (const g of groups) {
        const parents = g.parentIds ?? [];
        parentByChild.set(g.id, parents.slice());
    }

    for (const g of groups) {
        for (const user of g.memberIds ?? []) {
            const arr = parentByChild.get(user) ?? [];
            if (!arr.includes(g.id)) arr.push(g.id);
            parentByChild.set(user, arr);
        }
    }

    ugCacheExpires = Date.now() + TTL_MS;
}

export function getAllParents(id: string): string[] {
    const cached = ancestorsCache.get(id);
    if (cached) return cached;

    const visiting = new Set<string>();
    const dfs = (cur: string): string[] => {
        if (visiting.has(cur)) return [];
        visiting.add(cur);

        const direct = parentByChild.get(cur) ?? [];
        const out: string[] = [];
        for (const p of direct) {
            out.push(p);
            const pAnc = ancestorsCache.get(p) ?? dfs(p);
            for (const a of pAnc) out.push(a);
        }

        visiting.delete(cur);
        const uniq = Array.from(new Set(out));
        ancestorsCache.set(cur, uniq);
        return uniq;
    };

    return dfs(id);
}