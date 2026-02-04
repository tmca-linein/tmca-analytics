"use client";

import { SpaceItem } from "@/types/wrikeItem";
import { ColumnDef } from "@tanstack/react-table";
import { ChevronsDownUp, ChevronsUpDown, ChevronDown, ChevronRight, Satellite, Folder, StickyNote, ClipboardList, Loader2, Link } from "lucide-react";


export const getColumns = (): ColumnDef<SpaceItem>[] => [
  {
    id: "itemName",
    accessorKey: "itemNam1e",
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
      const isLoading = loadingRows?.[row.original.id];

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
                  onRowExpand?.(row.original.id);
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
    size: 800,
    enableSorting: true,   // default is true
    meta: { pin: true },
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
    size: 250
  },
  {
    accessorKey: "sharedWith",
    header: "SharedWith",
    cell: ({ row }) => {
      const sharedWith = row.original.sharedWith;
      if (!sharedWith || sharedWith === '') return <span className="text-muted-foreground">—</span>;

      return <span>{(sharedWith)}</span>;
    },
    size: 1000
  },
  {
    accessorKey: "anfAddedDay",
    header: "ANF-ADDED Yesterday",
    size: 250,
  },
  {
    accessorKey: "anfAddedWeek",
    header: "ANF-ADDED This week",
    size: 250,
  },
  {
    accessorKey: "anfAddedMonth",
    header: "ANF-ADDED This month",
    size: 250,
  },
  {
    accessorKey: "anfAddedLastMonth",
    header: "ANF-ADDED Last month",
    size: 250,
  },
  {
    accessorKey: "anfRemovedDay",
    header: "ANF-REMOVED Yesterday",
    size: 250,
  },
  {
    accessorKey: "anfRemovedWeek",
    header: "ANF-REMOVED This week",
    size: 250,
  },
  {
    accessorKey: "anfRemovedMonth",
    header: "ANF-REMOVED This month",
    size: 250,
  },
  {
    accessorKey: "anfRemovedLastMonth",
    header: "ANF-REMOVED Last month",
    size: 250,
  },
  {
    accessorKey: "avgDurationWeek",
    header: "ANF-AVG-Duration This week",
    size: 250
  },
  {
    accessorKey: "avgDurationMonth",
    header: "ANF-AVG-Duration This month",
    size: 250
  },
  {
    accessorKey: "avgDurationLastMonth",
    header: "ANF-AVG-Duration Last month",
    size: 250
  },
  {
    accessorKey: "topFiveAvgDurationWeek",
    header: "ANF-AVG-TOP5-Duration This week",
    size: 300
  },
  {
    accessorKey: "topFiveAvgDurationMonth",
    header: "ANF-AVG-TOP5-Duration This month",
    size: 300
  },
  {
    accessorKey: "topFiveAvgDurationLastMonth",
    header: "ANF-AVG-TOP5-Duration Last month",
    size: 300
  },
  {
    accessorKey: "avgOverdueHoursWeek",
    header: "ANF-AVG-Overdue-Duration This week",
    size: 300
  },
  {
    accessorKey: "avgOverdueHoursMonth",
    header: "ANF-AVG-Overdue-Duration This month",
    size: 300
  },
  {
    accessorKey: "avgOverdueHoursLastMonth",
    header: "ANF-AVG-Overdue-Duration Last month",
    size: 300
  },
  {
    accessorKey: "overdueCountWeek",
    header: "ANF-Overdue-Counts This week",
    size: 250
  },
  {
    accessorKey: "overdueCountMonth",
    header: "ANF-Overdue-Counts This month",
    size: 250
  },
  {
    accessorKey: "overdueCountLastMonth",
    header: "ANF-Overdue-Counts Last month",
    size: 250
  },
  {
    accessorKey: "transitionsCountWeek",
    header: "ANF-Transition-Counts This week",
    size: 250
  },
  {
    accessorKey: "transitionsCountMonth",
    header: "ANF-Transition-Counts This month",
    size: 250
  },
  {
    accessorKey: "transitionsCountLastMonth",
    header: "ANF-Transition-Counts Last month",
    size: 250
  },
  {
    accessorKey: "countDay",
    header: "Comments-ADDED Yesterday",
    size: 250,
  },
  {
    accessorKey: "countWeek",
    header: "Comments-ADDED This week",
    size: 250,
  },
  {
    accessorKey: "countMonth",
    header: "Comments-ADDED This month",
    size: 250,
  },
  {
    accessorKey: "countLastMonth",
    header: "Comments-ADDED Last month",
    size: 250,
  },
  {
    accessorKey: "avgWordCountDay",
    header: "Comment-AVG-Length Yesterday",
    size: 250,
  },
  {
    accessorKey: "avgWordCountWeek",
    header: "Comment-AVG-Length This week",
    size: 250,
  },
  {
    accessorKey: "avgWordCountMonth",
    header: "Comment-AVG-Length This month",
    size: 250,
  },
  {
    accessorKey: "avgWordCountLastMonth",
    header: "Comment-AVG-Length Last month",
    size: 250,
  }
];