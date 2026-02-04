import prisma from "@/lib/db";
import { axiosRequest } from "@/lib/axios";
import { WrikeLegacyIdConversionResponse } from "@/types/user";

const v4ToLegacyCache: Map<string, string> = new Map<string, string>();
const legacyToV4Cache: Map<string, string> = new Map<string, string>();
const TTL_MS = 60 * 60 * 1000;
let mappingCacheExpires: number;
let fetchInFlight: Promise<void> | null = null;

async function cachedFetchMappings() {
  if (fetchInFlight) return fetchInFlight;

  const now = Date.now();
  if (mappingCacheExpires && mappingCacheExpires > now)
    return;

  fetchInFlight = (async () => {
    try {
      legacyToV4Cache.clear();
      v4ToLegacyCache.clear();
      const uniqueLegacyUsers = await prisma.aNFEvent.findMany({
        distinct: ["assignedUserId"],
        select: { assignedUserId: true },
      });

      const ids = uniqueLegacyUsers.map((u) => u.assignedUserId).filter(Boolean).sort();
      if (ids.length === 0) return;

      const res = await axiosRequest<WrikeLegacyIdConversionResponse>(
        "GET",
        `/ids?type=ApiV2User&ids=[${ids.join(",")}]`
      );

      const mappingList = (res?.data?.data ?? []);

      if (!Array.isArray(mappingList) || mappingList.length === 0) {
        return;
      }

      mappingList.map((u) => v4ToLegacyCache.set(u.id, u.apiV2Id));
      mappingList.map((u) => legacyToV4Cache.set(u.apiV2Id, u.id));
      mappingCacheExpires = Date.now() + TTL_MS;
    } catch (error) {
      if (v4ToLegacyCache.size === 0 || legacyToV4Cache.size === 0) {
        throw error;
      }

      console.warn("Failed to refresh legacy cache - using stale cache:", error);
    } finally {
      fetchInFlight = null;
    }
  })();

  return fetchInFlight;
}


export async function getUserIdMapping(): Promise<{ v4ToLegacy: Map<string, string>, legacyToV4: Map<string, string> }> {
  await cachedFetchMappings();
  return { v4ToLegacy: v4ToLegacyCache, legacyToV4: legacyToV4Cache }
}
