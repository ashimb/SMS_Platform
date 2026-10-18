import { Button } from "@school-platform/ui";
import { Plus, SearchX, UsersRound } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router-dom";

import { Can } from "@/shared/components/Can.tsx";
import { DataTable } from "@/shared/components/DataTable.tsx";
import { EmptyState } from "@/shared/components/EmptyState.tsx";
import { PageHeader } from "@/shared/components/PageHeader.tsx";
import { QueryError } from "@/shared/components/QueryError.tsx";
import { PERMISSIONS } from "@/shared/constants/permissions.ts";
import { ROUTES } from "@/shared/constants/routes.ts";
import { DEFAULT_PAGE_SIZE, SEARCH_DEBOUNCE_MS } from "@/shared/constants/session.ts";
import { useDebounce } from "@/shared/hooks/useDebounce.ts";

import { useStudents } from "../api/index.ts";
import { useStudentColumns } from "../components/studentColumns.tsx";
import { StudentFilters } from "../components/StudentFilters.tsx";
import { parseListParams, toSearchParams } from "../schemas.ts";
import type { StudentListParams } from "../types.ts";

/**
 * Students list: server-side pagination, debounced search and status filter. All list state lives
 * in the URL (?q=&status=&page=), so reloads, the back button and shared links keep the view.
 */
export function StudentsListPage() {
  const { t } = useTranslation("students");
  const [searchParams, setSearchParams] = useSearchParams();
  const params = parseListParams(searchParams);
  const [search, setSearch] = useState(params.q);
  const debouncedSearch = useDebounce(search, SEARCH_DEBOUNCE_MS);
  const columns = useStudentColumns();

  const update = (next: Partial<StudentListParams>) => {
    setSearchParams(toSearchParams({ ...params, ...next }), { replace: true });
  };

  // Push the debounced search into the URL (and back to page 1).
  useEffect(() => {
    if (debouncedSearch.trim() !== params.q.trim()) {
      setSearchParams(toSearchParams({ ...params, q: debouncedSearch.trim(), page: 1 }), {
        replace: true,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to the debounced text
  }, [debouncedSearch]);

  const query = useStudents(params);
  const filtered = params.q !== "" || params.status !== null;
  const data = query.data;

  const clear = () => {
    setSearch("");
    setSearchParams(new URLSearchParams(), { replace: true });
  };

  const empty = filtered ? (
    <EmptyState
      icon={<SearchX />}
      title={t("list.noResultsTitle")}
      description={t("list.noResultsBody")}
      action={
        <Button type="button" variant="secondary" onClick={clear}>
          {t("list.clearFilters")}
        </Button>
      }
      className="border-0 bg-none"
    />
  ) : (
    <EmptyState
      icon={<UsersRound />}
      title={t("list.emptyTitle")}
      description={t("list.emptyBody")}
      action={
        <Can permission={PERMISSIONS.studentsCreate}>
          <Button asChild>
            <Link to={ROUTES.studentNew}>
              <Plus aria-hidden="true" />
              {t("list.add")}
            </Link>
          </Button>
        </Can>
      }
      className="border-0 bg-none"
    />
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("list.title")}
        description={data ? t("list.count", { count: data.total }) : t("list.description")}
        actions={
          <Can permission={PERMISSIONS.studentsCreate}>
            <Button asChild>
              <Link to={ROUTES.studentNew}>
                <Plus aria-hidden="true" />
                {t("list.add")}
              </Link>
            </Button>
          </Can>
        }
      />
      <StudentFilters
        search={search}
        onSearchChange={setSearch}
        status={params.status}
        onStatusChange={(status) => {
          update({ status, page: 1 });
        }}
        onClear={clear}
      />
      <DataTable
        caption={t("list.caption")}
        columns={columns}
        data={data?.items ?? []}
        getRowId={(row) => row.id}
        loading={query.isPending}
        loadingRows={8}
        fetching={query.isFetching && !query.isPending}
        error={
          query.isError ? (
            <QueryError error={query.error} onRetry={() => void query.refetch()} />
          ) : undefined
        }
        empty={empty}
        mobile={{
          primary: "name",
          secondary: ["class", "status"],
          showDetailsLabel: t("list.showDetails"),
          hideDetailsLabel: t("list.hideDetails"),
        }}
        {...(data
          ? {
              pagination: {
                page: data.page,
                pageCount: data.pages,
                pageSize: data.page_size || DEFAULT_PAGE_SIZE,
                total: data.total,
                onPageChange: (page: number) => {
                  update({ page });
                },
              },
            }
          : {})}
      />
    </div>
  );
}

export default StudentsListPage;
