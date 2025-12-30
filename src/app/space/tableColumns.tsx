"use client";

import { SpaceItem } from "@/types/wrikeItem";
import { ColumnDef } from "@tanstack/react-table";
import { ChevronsDownUp, ChevronsUpDown, ChevronDown, ChevronRight, Satellite, Folder, StickyNote, ClipboardList, Loader2, Link } from "lucide-react";


export const getColumns = (): ColumnDef<SpaceItem>[] => [
  {
    id: "itemName",
    accessorKey: "itemName",
    header: ({ table }) => (
      <div className="flex items-center gap-2">
        <button onClick={table.getToggleAllRowsExpandedHandler()}>
          {table.getIsAllRowsExpanded() ? (
            <ChevronsDownUp className="translate-y-[2px] h-4 w-4" />
          ) : (
            <ChevronsUpDown className="translate-y-[2px] h-4 w-4" />
          )}
        </button>
        <span>Item Name</span>
      </div>
    ),
    cell: ({ row, table }) => {
      const { onRowExpand, loadingRows } = table.options.meta ?? {};
      const isLoading = loadingRows?.[row.original.itemId];

      return (
        <div
          className="flex items-center gap-2"
          style={{ paddingLeft: `${row.depth}rem` }}
        >
          {row.getCanExpand() ? (
            <button
              className="p-1"
              onClick={(e) => {
                e.stopPropagation(); // prevents row click if you have one
                row.toggleExpanded();
                if (!row.getIsExpanded()) {
                  onRowExpand?.(row.original.itemId);
                }
              }}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : row.getIsExpanded() ? (
                <ChevronDown className="translate-y-[2px] h-4 w-4" />
              ) : (
                <ChevronRight className="translate-y-[2px] h-4 w-4" />
              )}
            </button>
          ) : (
            // keep alignment when there's no expander
            <span className="inline-block w-6" />
          )}

          <span>{row.original.itemName}</span>
          {/* or flexRender if you need custom rendering */}
        </div>
      );
    },
    size: 1000,
    enableSorting: true,   // default is true
  },
  {
    accessorKey: "itemType",
    header: "Item Type",
    cell: ({ getValue }) => {
      const type = getValue<string>();
      const Icon = type === "Space"
        ? Satellite
        : type === "Folder"
          ? Folder
          : type === "Project"
            ? ClipboardList
            : StickyNote;

      return (
        <div className="flex items-center space-x-2">
          <Icon className="w-4 h-4 text-gray-600" />
          <span className="text-sm">{type}</span>
        </div>
      );
    },
    size: 100
  },
  {
    accessorKey: "sharedWith",
    header: "SharedWith",
    cell: ({ row }) => {
      const sharedWith = row.original.sharedWith;
      if (!sharedWith || sharedWith === '') return <span className="text-muted-foreground">—</span>;

      return <span>{(sharedWith)}</span>;
    },
    size: 500
  },
  {
    accessorKey: "permalink",
    header: "Link",
    cell: ({ getValue }) => {
      const url = getValue<string>();
      return url ? (
        <a href={url}><Link className="w-4 h-4 text-gray-600" /></a>
      ) : <></>;
    },
    size: 100
  },
  {
    accessorKey: "author",
    header: "Author",
    size: 300
  }
];