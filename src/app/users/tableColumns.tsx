"use client";

import { getMetricColumns } from "@/components/table/metric-columns";
import { User } from "@/types/user";
import { ColumnDef } from "@tanstack/react-table";


export const getColumns = (): ColumnDef<User>[] => [
  {
    accessorKey: "firstName",
    header: "First Name",
    size: 250,
    meta: { pin: true },
  },
  {
    accessorKey: "lastName",
    header: "Last Name",
    size: 250,
    meta: { pin: true },
  },
  {
    accessorKey: "primaryEmail",
    header: "Email",
    cell: ({ cell }) => (
      <div className="whitespace-normal break-words">
        {cell.getValue<string>()}
      </div>
    ),
    size: 400,
    enableSorting: false,
  },
  ...getMetricColumns()
];