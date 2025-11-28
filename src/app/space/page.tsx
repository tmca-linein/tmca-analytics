import { SpaceItemsTable } from "./SpaceItemsTable";
import prisma from '@/lib/db';

const fetchSpaceItemTree = async () => {
  const spaces = await prisma.wrikeItem.findMany({
    where: {
      itemType: "Space",
      parentLinks: { none: {} },
    },
    select: {
      id: true,
      title: true,
      warning: true,
      permalink: true,
      itemType: true,

      author: {
        select: {
          firstName: true,
          lastName: true,
        },
      },

      sharedWith: {
        select: {
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      },

      childLinks: {
        select: {
          child: {
            select: {
              id: true,
              title: true,
              itemType: true,
              warning: true,
              permalink: true,

              author: {
                select: { firstName: true, lastName: true },
              },
              sharedWith: {
                select: {
                  user: {
                    select: { firstName: true, lastName: true },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  const result = spaces.map(space => ({
    itemId: space.id,
    itemName: space.title,
    itemType: space.itemType,
    author: space.author ? `${space.author?.firstName} ${space.author?.lastName}` : "",
    childIds: space.childLinks.map(link => link.child.id),
    subRows: space.childLinks.map(link => {
      const child = link.child;
      return {
        itemId: child.id,
        itemName: child.title,
        itemType: child.itemType,
        author: space.author ? `${space.author?.firstName} ${space.author?.lastName}` : "",
        childIds: [],
        subRows: [],
        warning: child.warning || "",
        sharedWith: child.sharedWith.map(e => `${e.user?.firstName} ${e.user?.lastName}`),
        permalink: child.permalink,
      };
    }),

    warning: space.warning || "",
    sharedWith: space.sharedWith.map(e => `${e.user?.firstName} ${e.user?.lastName}`),
    permalink: space.permalink,
  }));

  return result;
};


const SpaceItemsPage = async () => {
  const data = await fetchSpaceItemTree();
  console.log('Spaces: Current runtime:', process.env.NEXT_RUNTIME); // 'edge' or 'nodejs'

  return (
    <>
      <div className="mb-8 px-4 py-2 bg-secondary rounded-md">
        <h1 className="font-semibold">Space overview</h1>
      </div>
      <div className="flex-1 overflow-hidden">
        <SpaceItemsTable initialData={data} />
      </div>
    </>
  );
};

export default SpaceItemsPage;
