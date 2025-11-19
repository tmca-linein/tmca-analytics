import { axiosRequest } from '@/lib/axios';
import { SpaceItemsTable } from "./SpaceItemsTable";
import { SpaceItem, WrikeFolderTree } from "./types";
import { getUserName } from "./user-cache";
import { decode } from 'next-auth/jwt';
import { cookies } from 'next/headers';

const fetchSpaceItemTree = async () => {
  const response = await axiosRequest('GET', '/spaces')
  const roots: SpaceItem[] = [];
  const data = Array.from(response.data.data) as WrikeFolderTree[];
  console.log(data)
  const spaceDetails = await Promise.all(
    data.map((f) =>
      axiosRequest('GET', `/folders/${f.id}`).catch(() => null)
    )
  );

  const spaceInfo = await Promise.all(
    spaceDetails.map(async (res, i) => {
      if (!res) return null;
      const folder = res.data.data[0];
      const sharedNames = await Promise.all(
        folder.sharedIds.map(getUserName)
      );

      return {
        ...data[i],
        permalink: folder.permalink,
        sharedWith: sharedNames.filter(Boolean).join(", "),
      };
    })
  );

  spaceInfo.forEach((item) => {
    const spaceItem: SpaceItem = {
      itemId: item.id,
      itemName: item.title,
      itemType: "Space",
      author: "",
      childIds: [],
      subRows: [],
      warning: "",
      sharedWith: item.sharedWith,
      permalink: item.permalink
    };

    roots.push(spaceItem);
  });

  return roots;
};


const SpaceItemsPage = async () => {
  const data = await fetchSpaceItemTree();
  return (
    <div className="">
      <div className="mb-8 px-4 py-2 bg-secondary rounded-md">
        <h1 className="font-semibold">Space overview</h1>
      </div>
      {/* <SpaceItemsTable initialData={data} /> */}
    </div>
  );
};

export default SpaceItemsPage;
