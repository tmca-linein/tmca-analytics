'use client';

import { useCallback, useMemo } from 'react';
import { DataTable } from '../../components/table/data-table';
import { Row } from '@tanstack/react-table';
import clsx from 'clsx';
import { SpaceItem } from '@/types/wrikeItem';
import { useRouter } from 'next/navigation';
import { getColumns } from './tableColumns';

interface Props {
    spaceItems: SpaceItem[];
    rootItemIds: string[];
}

export const SharedSpaceItemsTable: React.FC<Props> = ({ spaceItems, rootItemIds }) => {
    const router = useRouter();
    const columns = getColumns();
    const itemMap = useMemo(() => {
        return new Map(spaceItems.map((item) => [item.id, item] as const));
    }, [spaceItems]);

    const getWrikeRowClassName = (row: Row<SpaceItem>) => {
        const item = row.original;

        return clsx(
            item.warning && "bg-warning hover:bg-warning-hover",
            {
                "sticky z-10 bg-space hover:bg-space-hover": item.itemType === "Space",
                "bg-folder hover:bg-folder-hover": item.itemType === "Folder",
                "bg-project hover:bg-project-hover": item.itemType === "Project",
                "bg-background hover:bg-sidebar-light dark:hover:bg-sidebar-light": item.itemType === "Task"
            }
        );
    };

    const rowClickEvent = useCallback(
        (id: string) => {
            const clickedItem = itemMap.get(id);
            if (!clickedItem) return;

            if (clickedItem.itemType !== "Project" && clickedItem.itemType !== "Folder") return;
            router.push(`/space-item/${id}`);
        },
        [itemMap, router]
    );

    const formattedData = useMemo(() => {
        const cloned = new Map<string, SpaceItem>(
            [...itemMap.entries()].map(([id, item]) => [
                id,
                item,
            ])
        );

        for (const item of cloned.values()) {
            const folderChildren = (item.folderChildIds ?? [])
                .map((childId) => cloned.get(childId))
                .filter((x): x is SpaceItem => !!x);

            const taskChildren = (item.taskChildIds ?? [])
                .map((childId) => cloned.get(childId))
                .filter((x): x is SpaceItem => !!x);

            item.subRows = folderChildren.length || taskChildren.length
                ? [...folderChildren, ...taskChildren]
                : [];
        }

        return rootItemIds
            .map((id) => cloned.get(id))
            .filter((x): x is SpaceItem => !!x);
    }, [itemMap, rootItemIds]);

    return (
        <DataTable
            columns={columns}
            data={formattedData}
            meta={{
                onRowClicked: rowClickEvent,
                getRowClassName: getWrikeRowClassName,
            }}
        />
    );
};