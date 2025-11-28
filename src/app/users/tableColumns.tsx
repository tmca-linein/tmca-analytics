"use client";

import { SpaceItem } from "@/types/wrikeItem";
import { ColumnDef } from "@tanstack/react-table";
import { ChevronsDownUp, ChevronsUpDown, ChevronDown, ChevronRight, Satellite, Folder, StickyNote, ClipboardList, Loader2, Link } from "lucide-react";


export const getColumns = (): ColumnDef<SpaceItem>[] => [
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
    accessorKey: "anfAddedThisWeek",
    header: "ANF-ADDED Week",
  },
  {
    accessorKey: "anfAddedThisMonth",
    header: "ANF-ADDED Month",
  },
  {
    accessorKey: "anfRemovedToday",
    header: "ANF-REMOVED Today",
  },
  {
    accessorKey: "anfRemovedThisWeek",
    header: "ANF-REMOVED Week",
  },
  {
    accessorKey: "anfRemovedThisMonth",
    header: "ANF-REMOVED Month",
  }
];