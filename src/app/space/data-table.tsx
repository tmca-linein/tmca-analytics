"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getPaginationRowModel,
  SortingState,
  ExpandedState,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { DataTablePagination } from "@/components/TablePagination";
import { useState } from "react";
import clsx from "clsx";
import { useEffect, useRef } from "react";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  meta?: Record<string, any>;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  meta
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState({});
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [offset, setOffset] = useState(0);
  const headerRef = useRef<HTMLTableSectionElement>(null);

  useEffect(() => {
    if (headerRef.current) setOffset(headerRef.current.offsetHeight);
  }, []);
  // const [pagination, setPagination] = useState({
  //   pageIndex: 0, //initial page index
  //   pageSize: 50, //default page size
  // });
  const table = useReactTable({
    data,
    columns,
    onExpandedChange: setExpanded,
    getSubRows: (row) => row.subRows ?? [],
    getCoreRowModel: getCoreRowModel(),
    // getPaginationRowModel: getPaginationRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    // onPaginationChange: setPagination,
    getRowCanExpand: (row) => row.original.itemType !== "Task",
    state: {
      expanded,
      sorting,
      rowSelection,
      // pagination,
    },
    meta
  });

  return (
    <>
      <div className="relative max-h-[calc(90vh-8rem)] overflow-y-auto overflow-x-auto text-sm">
        {/* header */}
        <div role="rowgroup" className="sticky bg-background top-0 z-20 border-b min-w-[720px] " ref={headerRef}>
          {table.getHeaderGroups().map(hg => (
            <div role="row" key={hg.id} className="grid grid-cols-[repeat(auto-fit,minmax(0,1fr))] min-w-[720px]">
              {hg.headers.map(h => (
                <div role="columnheader" key={h.id} className="p-2 font-semibold">
                  {flexRender(h.column.columnDef.header, h.getContext())}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* body */}
        <div role="rowgroup" className="min-w-[720px]">
          {table.getRowModel().rows.map((row) => {
            const isSpace = row.original.itemType === "Space";
            return (
              <div
                role="row"
                key={row.id}
                className={clsx(
                  "min-w-[720px]",
                  "grid grid-cols-[repeat(auto-fit,minmax(0,1fr))] border-b",
                  // isSpace && " top-[2.5rem]  bg-white", // adjust top to sit below header
                  (row.original.warning !== ""
                    ? "bg-warning/70 hover:bg-warning/80"
                    : ""),
                  (isSpace
                    ? "sticky z-10 bg-space hover:bg-space/80" : row.original.itemType === "Folder"
                      ? "bg-folder hover:bg-folder/80"
                      : row.original.itemType === "Project"
                        ? "bg-project hover:bg-project/80"
                        : "")
                )}
                style={{ top: `${offset}px` }}
              >
                {row.getVisibleCells().map((cell) => (
                  <div role="cell" key={cell.id} className="p-2">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* <DataTablePagination table={table} /> */}
    </>
  );
}
