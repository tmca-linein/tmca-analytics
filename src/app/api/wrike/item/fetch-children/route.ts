import prisma from "@/lib/db";
import { SpaceItem } from "@/types/wrikeItem";


export async function POST(
  request: Request,
) {
  const { parentIds } = await request.json();
  console.log('route: Current runtime:', process.env.NEXT_RUNTIME); // 'edge' or 'nodejs'

  if (!parentIds?.length) {
    return Response.json({});
  }


  const items = await prisma.wrikeItem.findMany({
    where: {
      parentLinks: { some: { parentId: { in: parentIds } } },
    },
    include: {
      parentLinks: {
        select: { parentId: true },
      },
      childLinks: {
        include: {
          child: {
            include: {
              author: true,
              sharedWith: { include: { user: true } },
            }
          }
        }, // only 1st level children
      },
      author: true,
      sharedWith: { include: { user: true } },
    },
  });

  const formatItem = (item: any) => ({
    itemId: item.id,
    itemName: item.title,
    itemType: item.itemType,
    author: item.author
      ? `${item.author.firstName} ${item.author.lastName}`.trim()
      : "",
    childIds: item.childLinks.map((link: any) => link.child.id),
    subRows: item.childLinks.map((link: any) => {
      const child = link.child;
      return {
        itemId: child.id,
        itemName: child.title,
        itemType: child.itemType,
        author: child.author
          ? `${child.author.firstName} ${child.author.lastName}`.trim()
          : "",
        childIds: [],
        subRows: [],
        warning: child.warning || "",
        sharedWith: child.sharedWith.map(
          (e: any) => `${e.user?.firstName} ${e.user?.lastName}`.trim()
        ),
        permalink: child.permalink,
      };
    }),
    warning: item.warning || "",
    sharedWith: item.sharedWith.map(
      (e: any) => `${e.user?.firstName} ${e.user?.lastName}`.trim()
    ),
    permalink: item.permalink,
  });

  const result: Record<string, SpaceItem[]> = {};
  for (const item of items) {
    const formatted = formatItem(item);
    for (const link of item.parentLinks) {
      const parentId = link.parentId;
      if (!result[parentId]) result[parentId] = [];
      result[parentId].push(formatted);
    }
  }

  for (const id of parentIds) {
    if (!result[id]) result[id] = [];
  }

  return Response.json(result);
}