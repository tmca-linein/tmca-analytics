"use client";

import { MultiValueInputCell } from "@/components/table/MultiValueInput";
import { SelectCell } from "@/components/table/SelectCell";
import { Button } from "@/components/ui/button";
import { RBAC } from "@/generated/prisma";
import { ColumnDef } from "@tanstack/react-table";
import { Trash2 } from "lucide-react";



export const getColumns = (props: {
    companies: string[],
    companyRoles: Map<string, string[]>
}): ColumnDef<RBAC>[] => [
        {
            accessorKey: "company",
            header: "Company",
            cell: ({ getValue, row, column, table }) => {
                const companies = props.companies;
                const options = companies.map(c => ({ "label": c, "value": c }));
                return (
                    <SelectCell
                        value={getValue() as string}
                        rowId={row.original.id}
                        columnId={column.id}
                        options={options}
                        updateData={table.options.meta?.updateData}
                    />
                )
            },
            size: 350,
        },
        {
            accessorKey: "role",
            header: "Role",
            cell: ({ getValue, row, column, table }) => {
                const company = row.original.company;
                const companyRoles = props.companyRoles;
                const roles = companyRoles.get(String(company)) ?? [];
                const options = roles.map(c => ({ "label": c, "value": c }));

                return (
                    <SelectCell
                        value={(getValue() as string | null) ?? ""}
                        rowId={row.original.id}
                        columnId={column.id}
                        options={options}
                        updateData={table.options.meta?.updateData}
                        disabled={!company || options.length === 0}
                    />
                );
            },
            size: 350,
        },
        {
            accessorKey: "accessTo",
            header: "Access To",
            cell: ({ getValue, row, column, table }) => (
                <MultiValueInputCell
                    value={getValue() as string[]}
                    rowId={row.original.id}
                    columnId={column.id}
                    updateData={table.options.meta?.updateData}
                    placeholder="Add tag and press Enter"
                />
            ),
            size: 350,
        },
        {
            id: "actions",
            header: "",
            size: 60,
            cell: ({ row, table }) => (
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                        e.stopPropagation();
                        table.options.meta?.removeRow?.(row.original.id);
                    }}
                    aria-label="Delete row"
                    title="Delete row"
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            ),
        }
    ];