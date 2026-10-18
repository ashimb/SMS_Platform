import {
  type ColumnDef,
  createColumnHelper,
  flexRender,
  type RowData,
  tableFeatures,
  useTable,
} from "@tanstack/react-table";
import { type ReactNode } from "react";

import { cn } from "../lib/cn.ts";
import { Skeleton } from "./Skeleton.tsx";

/**
 * Feature set for the DataTable shell (TanStack Table v9). Sorting, filtering, pagination and
 * selection are added here as screens need them; the markup and states below stay the same.
 */
export const dataTableFeatures = tableFeatures({});
export type DataTableFeatures = typeof dataTableFeatures;

/** Typed column helper bound to the DataTable feature set. */
export function createDataTableColumnHelper<TData extends RowData>() {
  return createColumnHelper<DataTableFeatures, TData>();
}

export interface DataTableProps<TData extends RowData> {
  data: readonly TData[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- column value types differ per column
  columns: readonly ColumnDef<DataTableFeatures, TData, any>[];
  /** Accessible name of the table (rendered as <caption>, visually hidden by default). */
  caption: string;
  showCaption?: boolean;
  getRowId?: (row: TData) => string;
  loading?: boolean;
  loadingRows?: number;
  /** Error content (message + retry), replaces the body. */
  error?: ReactNode;
  /** Shown when there are no rows and no error. */
  empty?: ReactNode;
  className?: string;
}

/** The TanStack table instance shared by the table and the stacked-card presentations. */
export function useDataTable<TData extends RowData>({
  data,
  columns,
  getRowId,
}: Pick<DataTableProps<TData>, "data" | "columns" | "getRowId">) {
  return useTable({
    features: dataTableFeatures,
    data,
    columns: columns as ColumnDef<DataTableFeatures, TData>[],
    ...(getRowId ? { getRowId: (row: TData) => getRowId(row) } : {}),
  });
}

export type DataTableInstance<TData extends RowData> = ReturnType<typeof useDataTable<TData>>;

export interface DataTableViewProps<TData extends RowData> extends Omit<
  DataTableProps<TData>,
  "data" | "columns" | "getRowId"
> {
  table: DataTableInstance<TData>;
  /**
   * Tailwind max-height class (e.g. `max-h-[70dvh]`). The table then scrolls inside its own box,
   * which is what keeps the header row stuck to the top while the rows scroll.
   */
  maxHeightClassName?: string;
}

/** The semantic <table> markup with loading, empty and error states. */
export function DataTableView<TData extends RowData>({
  table,
  caption,
  showCaption = false,
  loading = false,
  loadingRows = 5,
  error,
  empty,
  className,
  maxHeightClassName,
}: DataTableViewProps<TData>) {
  const columnCount = Math.max(1, table.getAllLeafColumns().length);
  const rows = table.getRowModel().rows;

  let body: ReactNode;
  if (loading) {
    body = Array.from({ length: loadingRows }, (_, index) => (
      <tr key={`loading-${String(index)}`} className="border-b border-border last:border-0">
        {Array.from({ length: columnCount }, (__, cell) => (
          <td key={cell} className="px-4 py-3">
            <Skeleton className="h-4 w-full max-w-40" />
          </td>
        ))}
      </tr>
    ));
  } else if (error) {
    body = (
      <tr>
        <td colSpan={columnCount} className="px-4 py-10 text-center">
          {error}
        </td>
      </tr>
    );
  } else if (rows.length === 0) {
    body = (
      <tr>
        <td colSpan={columnCount} className="px-4 py-10 text-center text-sm text-fg-muted">
          {empty ?? "No records to show."}
        </td>
      </tr>
    );
  } else {
    body = rows.map((row) => (
      <tr
        key={row.id}
        className="border-b border-border transition-colors last:border-0 hover:bg-surface-hover"
      >
        {row.getAllCells().map((cell) => (
          <td key={cell.id} className="px-4 py-3 align-middle text-fg">
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </td>
        ))}
      </tr>
    ));
  }

  return (
    <div
      className={cn(
        "overflow-x-auto rounded-xl border border-border bg-surface shadow-1",
        maxHeightClassName && ["overflow-y-auto overscroll-contain", maxHeightClassName],
        className,
      )}
      aria-busy={loading || undefined}
    >
      <table className="w-full border-collapse text-left text-sm">
        <caption
          className={cn(showCaption ? "px-4 py-3 text-left font-semibold text-fg" : "sr-only")}
        >
          {caption}
        </caption>
        <thead className="sticky top-0 z-10 bg-surface-sunken">
          {table.getHeaderGroups().map((group) => (
            <tr key={group.id} className="border-b border-border">
              {group.headers.map((header) => (
                <th
                  key={header.id}
                  scope="col"
                  colSpan={header.colSpan}
                  className="px-4 py-2.5 text-xs font-semibold tracking-wide whitespace-nowrap text-fg-muted uppercase"
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>{body}</tbody>
      </table>
    </div>
  );
}

/**
 * Accessible table shell: semantic <table> with caption and column headers, sticky header,
 * horizontal scroll inside its own box, and consistent loading / empty / error states. For data
 * that people read on phones, use ResponsiveDataTable (stacked cards below `md`).
 */
export function DataTable<TData extends RowData>({
  data,
  columns,
  getRowId,
  ...view
}: DataTableProps<TData> & { maxHeightClassName?: string }) {
  const table = useDataTable({ data, columns, ...(getRowId ? { getRowId } : {}) });
  return <DataTableView table={table} {...view} />;
}
