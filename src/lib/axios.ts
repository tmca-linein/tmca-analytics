import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import { decode } from "next-auth/jwt";
import { cookies } from "next/headers";

export const api = axios.create({
  baseURL: "https://www.wrike.com/api/v4/",
  headers: {
    "Content-Type": "application/json",
  },
});

async function getHeaderConfig(): Promise<AxiosRequestConfig | undefined> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(process.env.NEXTAUTH_SESSION_TOKEN as string)?.value;
  if (!sessionToken) return undefined;

  const token = await decode({
    token: sessionToken,
    secret: process.env.NEXTAUTH_SECRET!,
  });

  const accessToken = token?.accessToken;

  return {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  }
}

export async function axiosRequest<T = unknown>(
  type: "GET" | "POST",
  endpoint: string,
  data?: unknown,
  authHeader?: string
): Promise<AxiosResponse<T>> {
  let config;
  if (authHeader && authHeader !== '') {
    config = {
      headers: {
        Authorization: `Bearer ${authHeader}`,
      },
    }
  } else {
    config = await getHeaderConfig();
  }

  return api.request<T>({
    url: endpoint,
    method: type,
    ...(data !== undefined && type !== "GET" ? { data } : {}),
    ...config,
  })
}