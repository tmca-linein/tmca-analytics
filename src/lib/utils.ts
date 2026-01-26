import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}


export function startOfWeekMondayUTC(d = new Date()) {
  const x = new Date(d);
  const day = x.getUTCDay() || 7;
  x.setUTCDate(x.getUTCDate() - day + 1);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

export function startOfMonthUTC(d = new Date()) {
  const x = new Date(d);
  x.setUTCDate(1);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

export function startOfQuarterUTC(d = new Date()) {
  const x = new Date(d);
  const m = x.getUTCMonth();
  const qStartMonth = m - (m % 3);
  x.setUTCMonth(qStartMonth, 1);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

const toUtcIso = (bucket: string) => bucket.replace(" ", "T") + "Z";

export const sameMoment = (a: string, b: string) =>
  Date.parse(toUtcIso(a)) === Date.parse(b);

export const WRIKE_CHUNK_SIZE = 350;
export const WRIKE_TIMEOUT = 30_000;