'use client';

import { useState } from 'react';
import { DataTable } from '../../components/table/data-table';
import { getColumns } from './tableColumns';
import { Row } from '@tanstack/react-table';
import { getChildrenBatch } from './cachedWrikeItemRetriever';
import clsx from 'clsx';
import { SpaceItem } from '@/types/wrikeItem';

interface Props {
    initialData: SpaceItem[];
}

export const SpaceItemsTable: React.FC<Props> = ({ initialData }) => {
    const [data, setData] = useState<SpaceItem[]>(initialData);
    const [loadingRows, setLoadingRows] = useState<Record<string, boolean>>({});

    const handleExpand = async (rowId: string) => {
        const row = data.find(r => r.itemId === rowId);
        if (!row) return;

        const idsToLoad = row.subRows
            .filter(sub => !sub.subRows?.length)
            .map(sub => sub.itemId);

        if (!idsToLoad.length) return;

        setLoadingRows(prev => ({ ...prev, [rowId]: true }));

        try {
            const result = await getChildrenBatch(idsToLoad);

            setData(prev => prev.map(item => {
                if (item.itemId !== rowId) return item;
                const updated = item.subRows.map(sub => ({
                    ...sub,
                    subRows: result[sub.itemId] || [],
                }));
                return { ...item, subRows: updated };
            }));
        } finally {
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

    return (
            <DataTable
                columns={columns}
                data={data}
                meta={{
                    onRowExpand: handleExpand,
                    loadingRows,
                    getRowClassName: getWrikeRowClassName
                }}
            />
    );
};



