import '@tanstack/react-table';

declare module '@tanstack/react-table' {
  interface TableMeta<TData> {
    onRowClicked?: (rowId: string) => void;
    onRowExpand?: (rowId: string) => void;
    loadingRows?: Record<string, boolean>;
    getRowClassName?: (row: Row<TData>) => string;
    updateData?: (rowId: string, columnId: string, value: unknown) => void;
    removeRow?: (rowId: string) => void;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData, TValue> {
    pin?: boolean;
  }
}