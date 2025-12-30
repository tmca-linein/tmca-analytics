"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  ExpandedState,
  useReactTable,
  Row,
  getSortedRowModel,
  SortingState,
} from "@tanstack/react-table";
import { useState } from "react";
import clsx from "clsx";
import { useEffect, useRef } from "react";

interface DataTableProps<TData extends { id?: string, subRows?: TData[], warning?: string }, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  meta?: {
    loadingRows?: Record<string, boolean>;
    onRowExpand?: (rowId: string) => void;
    onRowClicked?: (rowId: string) => void;
    getRowClassName?: (row: Row<TData>) => string;
  }
}

export function DataTable<TData extends { id?: string, subRows?: TData[], warning?: string }, TValue>({
  columns,
  data,
  meta
}: DataTableProps<TData, TValue>) {
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [offset, setOffset] = useState(0);
  const [sorting, setSorting] = useState<SortingState>([]);
  const headerRef = useRef<HTMLTableSectionElement>(null);

  useEffect(() => {
    if (headerRef.current) setOffset(headerRef.current.offsetHeight);
    table.resetColumnSizing(true); // true = force re-measure
  }, []);

  const table = useReactTable({
    data,
    columns,
    enableColumnResizing: true,
    columnResizeMode: 'onChange',
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onExpandedChange: setExpanded,
    getSubRows: (row) => row.subRows ?? [],
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowCanExpand: (row) => !!(row.original.subRows?.length ?? 0 > 0),
    state: {
      expanded,
      sorting,
    },
    meta
  });
  const leafColumns = table.getAllLeafColumns();
  const gridTemplateColumns = leafColumns
    .map((col) => {
      const defaultSize = col.columnDef.size ?? 250;
      const currentSize = col.getSize();

      // If user has manually resized this column → use exact pixel size
      if (currentSize !== defaultSize) {
        return `${currentSize}px`;
      }

      // Otherwise: let it stay flexible
      return `${currentSize}px`;
    })
    .join(" ");
  return (
    <>
      <div className="h-full w-full overflow-auto text-sm">
        <div className="inline-block min-w-full align-middle">

          {/* header */}
          <div role="rowgroup" className="sticky bg-background top-0 z-20" ref={headerRef}>
            {table.getHeaderGroups().map(hg => (
              <div role="row" key={hg.id} className="grid" style={{
                gridTemplateColumns
              }}>
                {hg.headers.map(h => {
                  const canSort = h.column.getCanSort();
                  const sortDir = h.column.getIsSorted(); // false | 'asc' | 'desc'

                  return (

                    <div
                      role="columnheader"
                      key={h.id}
                      className={clsx(
                        "relative p-2 font-semibold box-border border-b border-r last:border-r-0",
                        canSort && "cursor-pointer select-none"
                      )}
                      onClick={canSort ? h.column.getToggleSortingHandler() : undefined}
                      title={
                        canSort
                          ? sortDir === "asc"
                            ? "Sorted ascending (click to sort desc)"
                            : sortDir === "desc"
                              ? "Sorted descending (click to clear)"
                              : "Click to sort"
                          : undefined
                      }
                    >
                      <div className="flex items-center gap-2">
                        {h.isPlaceholder
                          ? null
                          : flexRender(h.column.columnDef.header, h.getContext())}
                        {sortDir === "asc" && <span aria-hidden>▲</span>}
                        {sortDir === "desc" && <span aria-hidden>▼</span>}
                      </div>

                      {/* resize handle */}
                      {h.column.getCanResize() && (
                        <div
                          onMouseDown={h.getResizeHandler()}
                          onTouchStart={h.getResizeHandler()}
                          onClick={(e) => e.stopPropagation()}
                          className={clsx(
                            "absolute right-0 top-0 h-full w-1 cursor-col-resize select-none bg-primary/20 opacity-0 hover:opacity-100 transition-opacity",
                            h.column.getIsResizing() && "bg-primary opacity-100"
                          )}
                          title="Drag to resize"
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>

          {/* body */}
          <div role="rowgroup" className="">
            {table.getRowModel().rows.map((row) => {
              const { getRowClassName, onRowClicked } = table.options.meta ?? {};
              return (
                <div
                  role="row"
                  key={row.id}
                  className={clsx(
                    "grid",
                    getRowClassName?.(row)
                  )}
                  style={{
                    gridTemplateColumns,
                    top: `${offset}px`
                  }}
                  onClick={() => onRowClicked?.(row.original.id ?? '')}
                  title={row.original.warning}
                >
                  {row.getVisibleCells().map(cell => {
                    return (
                      <div
                        key={cell.id}
                        className={clsx(
                          "p-2",
                        )}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </div>
                    )
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div >
    </>
  );
}
