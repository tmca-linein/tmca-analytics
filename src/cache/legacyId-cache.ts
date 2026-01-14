import prisma from '@/lib/db';
import { axiosRequest, getHeaderConfig } from '@/lib/axios';
import { WrikeLegacyIdConversionResponse } from "@/types/user";
import { AxiosRequestConfig } from "axios";
import { unstable_cache } from "next/cache";

type Mapping = { id: string; apiV2Id: string }; // adjust


async function fetchMappings(config: AxiosRequestConfig | undefined) {
  const uniqueLegacyUsers = await prisma.aNFEvent.findMany({
    distinct: ["assignedUserId"],
    select: { assignedUserId: true },
  });

  const ids = uniqueLegacyUsers.map(u => u.assignedUserId).sort();
  if (ids.length === 0) return [];

  const res = await axiosRequest<WrikeLegacyIdConversionResponse>(
    "GET",
    `/ids?type=ApiV2User&ids=[${ids.join(",")}]`,
    undefined,
    config
  );

  return (res?.data.data ?? []) as Mapping[];
}

const cachedUserIdMapping = unstable_cache(
  async (config: AxiosRequestConfig | undefined) => await fetchMappings(config),
  [`wrike-legacyId`],
  { revalidate: 3600 }
);


export async function getUserIdMapping(): Promise<Mapping[]> {
  const config = await getHeaderConfig();
  return await cachedUserIdMapping(config);
}
