import { fetchSpaceItems, loadSecondLvlItemChildren } from "@/stats/spaceItemBuilder";
import { FullSpaceItemsTable } from "./FullSpaceItemsTable";

const SpaceItemsPage = async () => {
    const rootIsSpace = true;
    const { allSpaceItems, rootFolderIds } = await fetchSpaceItems(rootIsSpace);
    return (
        <>
            <div className="mb-8 px-4 py-2 bg-secondary rounded-md">
                <h1 className="font-semibold">Space overview</h1>
            </div>
            <div className="flex-1 overflow-hidden">
                <FullSpaceItemsTable spaceItems={allSpaceItems} rootItemIds={rootFolderIds} dataFetcher={loadSecondLvlItemChildren} />
            </div>
        </>
    );
}

export default SpaceItemsPage;