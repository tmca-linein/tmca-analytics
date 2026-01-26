import prisma from "@/lib/db";
import { axiosRequest, getHeaderConfig } from "@/lib/axios";
import { WrikeLegacyIdConversionResponse } from "@/types/user";
import { AxiosRequestConfig } from "axios";
import { unstable_cache } from "next/cache";

type Mapping = { id: string; apiV2Id: string };

export type Converters = {
  v4ToLegacy: Record<string, string>;
  legacyToV4: Record<string, string>;
};

const EMPTY_CONVERTERS: Converters = {
  v4ToLegacy: {},
  legacyToV4: {},
};

async function fetchMappings(config?: AxiosRequestConfig): Promise<Converters> {
  const uniqueLegacyUsers = await prisma.aNFEvent.findMany({
    distinct: ["assignedUserId"],
    select: { assignedUserId: true },
  });

  const ids = uniqueLegacyUsers.map((u) => u.assignedUserId).filter(Boolean).sort();
  if (ids.length === 0) return EMPTY_CONVERTERS;

  const res = await axiosRequest<WrikeLegacyIdConversionResponse>(
    "GET",
    `/ids?type=ApiV2User&ids=[${ids.join(",")}]`,
    undefined,
    config
  );

  const mappingList = (res?.data?.data ?? []) as Mapping[];

  if (!Array.isArray(mappingList) || mappingList.length === 0) {
    return EMPTY_CONVERTERS;
  }

  const v4ToLegacy = Object.fromEntries(mappingList.map((u) => [u.id, u.apiV2Id]));
  const legacyToV4 = Object.fromEntries(mappingList.map((u) => [u.apiV2Id, u.id]));

  return { v4ToLegacy, legacyToV4 };
}

const cachedUserIdMapping = unstable_cache(
  (config?: AxiosRequestConfig) => fetchMappings(config),
  ["wrike-legacyId"],
  { revalidate: 1 } // seconds
);

export async function getUserIdMapping(): Promise<{ v4ToLegacy: Map<string, string>, legacyToV4: Map<string, string> }> {
  const config = await getHeaderConfig();
  const mapping = await cachedUserIdMapping(config);
  return { v4ToLegacy: new Map(Object.entries(mapping.v4ToLegacy)), legacyToV4: new Map(Object.entries(mapping.legacyToV4)) }
}
