"use client";

import { ColumnDef, Row } from "@tanstack/react-table";
import { ChevronsDownUp, ChevronsUpDown, ChevronDown, ChevronRight, Satellite, Folder, StickyNote, ClipboardList, Loader2, Link } from "lucide-react";
import { SpaceItem } from "./types";

export const getColumns = (): ColumnDef<SpaceItem>[] => [
  {
    id: "all",
    header: ({ table }) => (
      <>
        <button
          {...{
            onClick: table.getToggleAllRowsExpandedHandler(),
          }}
        >
          {table.getIsAllRowsExpanded() ? (<ChevronsDownUp className="translate-y-[2px] h-4 w-4" />) : <ChevronsUpDown className="translate-y-[2px] h-4 w-4" />}
        </button>
      </>
    ),
    cell: ({ row, table }) => {
      const { onToggleExpand, loadingRows } = table.options.meta ?? {};
      const isLoading = loadingRows?.[row.original.itemId];

      return (
        <div style={{ paddingLeft: `${row.depth * 2}rem` }}>
          {row.getCanExpand() ? (
            <button
              onClick={() => {
                onToggleExpand?.(row);
                row.toggleExpanded();
              }}
              className="p-1"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : row.getIsExpanded() ? (
                <ChevronDown className="translate-y-[2px] h-4 w-4" />
              ) : (
                <ChevronRight className="translate-y-[2px] h-4 w-4" />
              )}
            </button>
          ) : null}
        </div>
      );
    },
    footer: props => props.column.id,
  },
  {
    accessorKey: "itemName",
    header: "Item Name",
  },
  {
    accessorKey: "itemType",
    header: "Item Type",
    cell: ({ row, getValue }) => {
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
  },
  {
    accessorKey: "author",
    header: "Author",
  },
  {
    accessorKey: "sharedWith",
    header: "SharedWith",
  },
  {
    accessorKey: "permalink",
    header: "Link",
    cell: ({ row, getValue }) => {
      const url = getValue<string>(); 
      return url ? (
        <a href={url}><Link className="w-4 h-4 text-gray-600"/></a>
      ) : <></>;
    },
  }
];