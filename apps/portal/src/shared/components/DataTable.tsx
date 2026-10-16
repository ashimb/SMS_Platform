/**
 * DataTable wrapper for server-paginated lists: the UI kit's accessible table (caption, loading,
 * empty and error states, horizontal scroll on phones) plus pagination below it.
 */
import { DataTable as BaseDataTable, type DataTableProps } from "@school-platform/ui";
import type { RowData } from "@tanstack/react-table";

import { cn } from "@/shared/utils/cn.ts";

import { Pagination, type PaginationProps } from "./Pagination.tsx";

export interface PaginatedDataTableProps<TData extends RowData> extends DataTableProps<TData> {
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
        <BaseDataTable {...props} />
      </div>
      {pagination && pagination.total > 0 ? (
        <Pagination {...pagination} disabled={pagination.disabled === true || fetching} />
      ) : null}
    </div>
  );
}

export { createDataTableColumnHelper } from "@school-platform/ui";
