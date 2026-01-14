'use client';

import { useEffect, useRef, useState } from 'react';
import { DataTable } from '../../components/table/data-table';
import { getColumns } from './tableColumns';
import { Button } from '@/components/ui/button';
import { RBAC } from '@/generated/prisma';

interface Props {
    initialData: RBAC[];
    options: {
        companies: string[];
        companyRoles: Map<string, string[]>;
    };
    persistData: (arr: RBAC[]) => void;
}

const makeRow = (): RBAC => ({
    id: 'new_' + crypto.randomUUID(),
    company: null,
    role: null,
    accessTo: [],
});


export const AdminTable: React.FC<Props> = ({ initialData, options, persistData }) => {
    const columns = getColumns(options);
    const [data, setData] = useState<RBAC[]>(initialData);
    const [saving, setSaving] = useState<boolean>(false);
    const addRow = () => setData((old) => [...old, makeRow()]);
    const [status, setStatus] = useState<{ type: string, message: string } | null>(null);
    const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const showStatus = (s: { type: "success" | "error"; message: string }) => {
        setStatus(s);

        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        hideTimerRef.current = setTimeout(() => {
            setStatus(null);
            hideTimerRef.current = null;
        }, 10_000);
    };

    // optional: cleanup on unmount
    useEffect(() => {
        return () => {
            if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        };
    }, []);

    return (
        <>
            <div className='h-[90%]'>
                <DataTable
                    columns={columns}
                    data={data}
                    meta={{
                        getRowClassName: () => "bg-background hover:bg-sidebar-light dark:hover:bg-sidebar-light",
                        updateData: (rowId, columnId, value) => {
                            setData((old) =>
                                old.map((r) => (r.id === rowId ? { ...r, [columnId]: value } : r))
                            );
                        },
                        removeRow: (rowId) => {
                            setData((old) => old.filter((r) => r.id !== rowId));
                        },
                    }}
                />
            </div>
            <div className="flex items-center mt-4 justify-start">

                <Button variant="outline" onClick={addRow}>
                    Add row
                </Button>

                <Button onClick={() => {
                    try {
                        setSaving(true);
                        persistData(data)
                        showStatus({ 'type': "success", "message": "Data saved succesfully!" })
                    } catch {
                        showStatus({ 'type': "error", "message": "Something went wrong!" })
                    } finally {
                        setSaving(false);
                    }
                }} className="ml-4 font-semibold justify-center bg-sidebar hover:bg-sidebar/90">
                    {saving ? 'Saving...' : 'Save'}
                </Button>

                {status && (
                    <div
                        className={[
                            "ml-4 rounded-md border px-3 py-2 text-sm",
                            status.type === "success"
                                ? "border-green-300 bg-green-50 text-green-800"
                                : "border-red-300 bg-red-50 text-red-800",
                        ].join(" ")}
                    >
                        {status.message}
                    </div>
                )}
            </div>

        </>
    );
};



