"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  ExpandedState,
  useReactTable,
  Row,
} from "@tanstack/react-table";
import { useState } from "react";
import clsx from "clsx";
import { useEffect, useRef } from "react";

interface DataTableProps<TData extends { subRows?: TData[] }, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  meta?: {
    loadingRows?: Record<string, boolean>;
    onRowExpand?: (rowId: string) => void;
    onRowClicked?: (rowId: string) => void;
    getRowClassName?: (row: Row<TData>) => string;
  }
}

export function DataTable<TData extends { subRows?: TData[] }, TValue>({
  columns,
  data,
  meta
}: DataTableProps<TData, TValue>) {
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [offset, setOffset] = useState(0);
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
    onExpandedChange: setExpanded,
    getSubRows: (row) => row.subRows ?? [],
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowCanExpand: (row) => !!(row.original.subRows?.length ?? 0 > 0),
    state: {
      expanded
    },
    meta
  });
  const leafColumns = table.getAllLeafColumns();

  // Detect if user has manually resized any column
  // TanStack Table starts with size = 150 by default if no size is set
  const hasUserResized = leafColumns.some(col => {
    const defaultSize = col.columnDef.size ?? 150;
    return col.getSize() !== defaultSize;
  });

  const gridTemplateColumns = leafColumns
    .map((col) => {
      const defaultSize = col.columnDef.size ?? 250;
      const currentSize = col.getSize();

      // If user has manually resized this column → use exact pixel size
      if (currentSize !== defaultSize) {
        return `${currentSize}px`;
      }

      // Otherwise: let it stay flexible
      return "minmax(0, 1fr)";
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
                {hg.headers.map(h => (
                  <div role="columnheader" key={h.id} className="relative p-2 font-semibold box-border border-b border-r last:border-r-0" style={{
                    position: "relative",
                  }}>
                    {h.isPlaceholder
                      ? null
                      : flexRender(h.column.columnDef.header, h.getContext())}
                    {h.column.getCanResize() && (
                      <div
                        onMouseDown={h.getResizeHandler()}
                        onTouchStart={h.getResizeHandler()}
                        className={clsx(
                          "absolute right-0 top-0 h-full w-1 cursor-col-resize select-none bg-primary/20 opacity-0 hover:opacity-100 transition-opacity",
                          h.column.getIsResizing() && "bg-primary opacity-100"
                        )}
                        title="Drag to resize"
                      />
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* body */}
          <div role="rowgroup" className="">
            {table.getRowModel().rows.map((row) => {
              const { getRowClassName, onRowClicked } = table.options.meta ?? {};
              const isClickable = !!onRowClicked;
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
                  onClick={() => onRowClicked?.((row.original as any).id)}
                >
                  {row.getVisibleCells().map((cell, index) => {
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
