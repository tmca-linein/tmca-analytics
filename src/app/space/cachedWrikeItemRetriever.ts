import { SpaceItem } from '@/types/wrikeItem';
import { cache } from 'react';

export const getChildrenBatch = cache(async (parentIds: string[]) => {
  const res = await fetch(`/api/wrike/item/fetch-children`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ parentIds }),
    next: { revalidate: 1800 }, // revalidate every 30 mins
  });

  if (!res.ok) throw new Error('Failed to fetch children');

  return (await res.json()) as Record<string, SpaceItem[]>;
});