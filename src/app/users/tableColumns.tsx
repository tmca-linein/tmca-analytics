"use client";

import { User } from "@/types/user";
import { ColumnDef } from "@tanstack/react-table";


export const getColumns = (): ColumnDef<User>[] => [
  {
    accessorKey: "firstName",
    header: "First Name",
  },
  {
    accessorKey: "lastName",
    header: "Last Name",
  },
  {
    accessorKey: "primaryEmail",
    header: "Email",
    cell: ({ cell }) => (
      <div className="whitespace-normal break-words">
        {cell.getValue<string>()}
      </div>
    ),
  },
  {
    accessorKey: "anfAddedToday",
    header: "ANF-ADDED Today",
  },
  {
    accessorKey: "anfRemovedToday",
    header: "ANF-REMOVED Today",
  },
  {
    accessorKey: "commentsAddedToday",
    header: "Comments ADDED Today",
  }
];