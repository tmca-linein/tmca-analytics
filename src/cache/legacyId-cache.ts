import { cache } from "react";
import prisma from '@/lib/db';
import { axiosRequest } from '@/lib/axios';
import { WrikeLegacyIdConversionResponse } from "@/types/user";

type Mapping = { id: string; apiV2Id: string }; // adjust

// Cached function: given a key (stringified IDs), fetch mappings once
const fetchMappingsCached = cache(async (idsKey: string) => {
  const ids = JSON.parse(idsKey) as string[];

  if (ids.length === 0) return [];

  const res = await axiosRequest<WrikeLegacyIdConversionResponse>(
    "GET",
    `/ids?type=ApiV2User&ids=[${ids.join(",")}]`
  );

  return (res?.data.data ?? []) as Mapping[];
});

export async function getUserIdMapping(): Promise<Mapping[]> {
  const uniqueLegacyUsers = await prisma.aNFEvent.findMany({
    distinct: ["assignedUserId"],
    select: { assignedUserId: true },
  });

  const uniqueIds = uniqueLegacyUsers.map(u => u.assignedUserId).sort();
  const key = JSON.stringify(uniqueIds); // cache key depends on current IDs
  return fetchMappingsCached(key);
}
