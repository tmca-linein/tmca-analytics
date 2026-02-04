import { SharedSpaceItemsTable } from "./SharedSpaceItemsTable";
import { fetchSpaceItems, loadSecondLvlItemChildren } from "@/stats/spaceItemBuilder";

const SharedItemsPage = async () => {
    const rootIsSpace = false;
    const { allSpaceItems, rootFolderIds } = await fetchSpaceItems(rootIsSpace);
    return (
        <>
            <div className="mb-8 px-4 py-2 bg-secondary rounded-md">
                <h1 className="font-semibold">Shared with me overview</h1>
            </div>
            <div className="flex-1 overflow-hidden">
                <SharedSpaceItemsTable spaceItems={allSpaceItems} rootItemIds={rootFolderIds} dataFetcher={loadSecondLvlItemChildren} />
            </div>
        </>
    );
}

export default SharedItemsPage;