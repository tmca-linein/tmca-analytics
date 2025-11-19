'use client';

import { useState } from 'react';
import { DataTable } from './data-table';
import { getColumns } from './columns';
import { SpaceItem, WrikeFolderTree } from './types';
import { Row } from '@tanstack/react-table';
import { useEffect } from 'react';
import { getUserName } from './user-cache';
import { axiosRequest } from '@/lib/axios';

interface Props {
    initialData: SpaceItem[];
}

async function fetchItems(type: "folders" | "tasks", items: WrikeFolderTree[]) {
    const details = await Promise.allSettled(
        items.map((i) => axiosRequest('GET', `/${type}/${i.id}`))
    );

    return Promise.all(
        details.map(async (r, i) => {
            if (r.status !== "fulfilled" || !r.value) return null;
            const data = r.value.data.data[0];
            const sharedNames = await Promise.all(data.sharedIds.map(getUserName));
            const authorName =
                type === "tasks"
                    ? await getUserName(data.authorIds?.[0])
                    : data.project
                        ? await getUserName(data.project.authorId)
                        : "";

            return {
                ...items[i],
                permalink: data.permalink,
                author: authorName,
                sharedWith: sharedNames.filter(Boolean).join(", "),
            };
        })
    );
}

export const SpaceItemsTable: React.FC<Props> = ({ initialData }) => {
    const [data, setData] = useState<SpaceItem[]>(initialData);
    const [loadingRows, setLoadingRows] = useState<Record<string, boolean>>({});

    useEffect(() => {
        const fetchContacts = async () => {
            const contacts = await axios.get('/contacts')
            const contactData = contacts.data.data;
            await Promise.all(contactData.map(c => getUserName(c.id)))
        }

        fetchContacts();
    }, []);

    const fetchChildren = async (row: Row<SpaceItem>): Promise<SpaceItem[]> => {
        const map = new Map<string, SpaceItem>();
        const [foldersRes, tasksRes] = await Promise.all([
            axios.get(`/folders/${row.original.itemId}/folders`),
            axios.get(`/folders/${row.original.itemId}/tasks`),
        ]);

        const folders = foldersRes.data.data as WrikeFolderTree[];
        const tasks = tasksRes.data.data as WrikeFolderTree[];

        const [foldersInfo, tasksInfo] = await Promise.all([
            fetchItems("folders", folders),
            fetchItems("tasks", tasks),
        ]);

        const fullItems = [...foldersInfo, ...tasksInfo]
        fullItems.forEach((item) => {
            const spaceItem: SpaceItem = {
                itemId: item.id,
                itemName: item.title,
                itemType: item.project ? "Project" : item.scope === "WsTask" ? "Task" : "Folder",
                author: item.author,
                childIds: item.childIds ? item.childIds : [],
                warning: ((item.scope === "WsTask") && (row.original.itemType === "Space")) ? "TASK_UNDER_SPACE" : "",
                permalink: item.permalink,
                sharedWith: item.sharedWith,
                subRows: [],
            };

            if (item.id !== row.original.itemId) map.set(item.id, spaceItem);
        });

        map.forEach((item) => {
            if (item.itemType === "Task") row.original.subRows.push(item);
            else {
                item.childIds?.forEach((cid) => {
                    const child = map.get(cid);
                    if (child) item.subRows.push(child);
                });
            }
        });

        const allChildIds = new Set(map.values().flatMap((i) => i.childIds ?? []));
        const roots = Array.from(map.values()).filter(
            (i) => !allChildIds.has(i.itemId)
        );
        return roots;
    };

    const onToggleExpand = async (row: Row<SpaceItem>) => {
        if (row.subRows?.length) return;

        setLoadingRows((prev) => ({ ...prev, [row.original.itemId]: true }));

        try {
            const children = await fetchChildren(row);
            setData((prev) =>
                prev.map((r) =>
                    r.itemId === row.original.itemId ? { ...r, subRows: children } : r
                )
            );
        } finally {
            setLoadingRows((prev) => ({ ...prev, [row.original.itemId]: false }));
        }
    };

    const columns = getColumns();

    return (
        <DataTable
            columns={columns}
            data={data}
            meta={{
                onToggleExpand,
                loadingRows,
            }}
        />
    );
};



