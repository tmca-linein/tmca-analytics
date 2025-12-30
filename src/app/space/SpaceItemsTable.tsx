'use client';

import { useMemo, useState } from 'react';
import { DataTable } from '../../components/table/data-table';
import { getColumns } from './tableColumns';
import { Row } from '@tanstack/react-table';
import clsx from 'clsx';
import { SpaceItem } from '@/types/wrikeItem';
import { isRedirectError } from 'next/dist/client/components/redirect-error';
import { ItemChildrenIds } from './serverSpaceHelpers';

interface Props {
    initialData: SpaceItem[];
    dataFetcher: (parent: SpaceItem, parentIds: ItemChildrenIds) => Promise<SpaceItem[]>;
}

export const SpaceItemsTable: React.FC<Props> = ({ initialData, dataFetcher }) => {
    const [data, setData] = useState<Map<string, SpaceItem>>(() => {
        return new Map(initialData.map(item => [item.itemId, item]))
    });
    const [fetchedForIds, setFetchedForIds] = useState<string[]>([]);

    const [loadingRows, setLoadingRows] = useState<Record<string, boolean>>({});

    const getChildrenIdsToFetch = (row: SpaceItem) => {
        const folderChildIds = []
        const taskChildIds = []
        // iterate over folder type first level children
        for (const subRowId of row.folderChildIds) {
            const subRow = data.get(subRowId);
            if (!subRow || (subRow.folderChildIds.length === 0 && subRow.taskChildIds.length === 0)) continue;
            // collect folder type 2nd level children
            folderChildIds.push(...subRow.folderChildIds);
            // folder children can also have task type children
            taskChildIds.push(...subRow.taskChildIds);
        }

        // iterate over task type first level children
        for (const subRowId of row.taskChildIds) {
            const subRow = data.get(subRowId);
            if (!subRow || subRow.taskChildIds.length === 0) continue;
            // task type children can only be of task type
            taskChildIds.push(...subRow.taskChildIds);
        }


        return { folderChildIds, taskChildIds };
    }

    const handleExpand = async (rowId: string) => {
        setLoadingRows(prev => ({ ...prev, [rowId]: true }));
        const row = data.get(rowId);
        if (!row || fetchedForIds.includes(rowId)) {
            setLoadingRows(prev => ({ ...prev, [rowId]: false }));
            return;
        }

        try {
            const childIds = getChildrenIdsToFetch(row);
            const children = await dataFetcher(row, childIds);
            setData(prevData =>
                new Map([...prevData, ...children.map((c: SpaceItem) => [c.itemId, c] as [string, SpaceItem])])
            );
        } catch (err) {
            if (isRedirectError(err)) throw err;
            console.error("Failed to load next level", err);
        } finally {
            setFetchedForIds(prev => [...prev, rowId]);
            setLoadingRows(prev => ({ ...prev, [rowId]: false }));
        }
    };

    const columns = getColumns();

    const getWrikeRowClassName = (row: Row<SpaceItem>) => {
        const item = row.original;

        return clsx(
            item.warning && "bg-warning/70 hover:bg-warning/80",
            {
                "sticky z-10 bg-space hover:bg-space/80": item.itemType === "Space",
                "bg-folder hover:bg-folder/80": item.itemType === "Folder",
                "bg-project hover:bg-project/80": item.itemType === "Project",
            }
        );
    };

    const formattedData = useMemo(() => {
        const itemMap = new Map<string, SpaceItem>(data);
        Array.from(itemMap.keys()).forEach(itemId => {
            const mappedItem = itemMap.get(itemId);
            if (!mappedItem) return;
            const children = mappedItem.folderChildIds
                .map(childId => itemMap.get(childId))
                .filter(Boolean) as SpaceItem[];
            const taskChildren = mappedItem.taskChildIds
                .map(childId => itemMap.get(childId))
                .filter(Boolean) as SpaceItem[];

            mappedItem.subRows = (children.length > 0 || taskChildren.length > 0) ? [...children, ...taskChildren] : [];
        });

        return Array.from(itemMap.values()).filter(
            item => item.itemType === "Space"
        );
    }, [data]);

    return (
        <DataTable
            columns={columns}
            data={formattedData}
            meta={{
                onRowExpand: handleExpand,
                loadingRows,
                getRowClassName: getWrikeRowClassName,
            }}
        />
    );
};

