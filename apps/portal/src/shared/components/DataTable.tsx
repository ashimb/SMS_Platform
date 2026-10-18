/**
 * DataTable wrapper for server-paginated lists: the UI kit's responsive table (full table from md,
 * stacked cards on phones; caption, loading, empty and error states) plus pagination below it.
 */
import { ResponsiveDataTable, type ResponsiveDataTableProps } from "@school-platform/ui";
import type { RowData } from "@tanstack/react-table";

import { cn } from "@/shared/utils/cn.ts";

import { Pagination, type PaginationProps } from "./Pagination.tsx";

export interface PaginatedDataTableProps<
  TData extends RowData,
> extends ResponsiveDataTableProps<TData> {
  pagination?: PaginationProps;
  /** True while a newer page is loading behind the current rows. */
  fetching?: boolean;
}

export function DataTable<TData extends RowData>({
  pagination,
  fetching = false,
  className,
  ...props
}: PaginatedDataTableProps<TData>) {
  return (
    <div className={cn("space-y-3", className)} aria-busy={fetching || props.loading === true}>
      <div className={cn("transition-opacity", fetching && "opacity-60")}>
        <ResponsiveDataTable {...props} />
      </div>
      {pagination && pagination.total > 0 ? (
        <Pagination {...pagination} disabled={pagination.disabled === true || fetching} />
      ) : null}
    </div>
  );
}

export { createDataTableColumnHelper } from "@school-platform/ui";
