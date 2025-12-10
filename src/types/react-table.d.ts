import '@tanstack/react-table';

declare module '@tanstack/react-table' {
  interface TableMeta<TData> {
    onRowExpand?: (rowId: string) => void;
    loadingRows?: Record<string, boolean>;
    getRowClassName?: (row: Row<TData>) => string;
  }
}