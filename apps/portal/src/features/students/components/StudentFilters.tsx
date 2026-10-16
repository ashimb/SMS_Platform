import { Button, Input, Select } from "@school-platform/ui";
import { Search, X } from "lucide-react";
import { useId } from "react";
import { useTranslation } from "react-i18next";

import { STUDENT_STATUSES, type StudentStatus } from "../types.ts";

const ALL = "all";

export interface StudentFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  status: StudentStatus | null;
  onStatusChange: (value: StudentStatus | null) => void;
  onClear: () => void;
}

/** Search (debounced by the page) and status filter. Labels stay visible for clarity. */
export function StudentFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
  onClear,
}: StudentFiltersProps) {
  const { t } = useTranslation("students");
  const searchId = useId();
  const statusId = useId();
  const active = search !== "" || status !== null;

  return (
    <div role="search" className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex flex-1 flex-col gap-1.5">
        <label htmlFor={searchId} className="text-sm font-medium text-fg">
          {t("list.searchLabel")}
        </label>
        <Input
          id={searchId}
          type="search"
          leading={<Search />}
          placeholder={t("list.searchPlaceholder")}
          value={search}
          maxLength={100}
          autoComplete="off"
          onChange={(event) => {
            onSearchChange(event.target.value);
          }}
          aria-describedby={`${searchId}-hint`}
        />
        <span id={`${searchId}-hint`} className="sr-only">
          {t("list.searchHint")}
        </span>
      </div>
      <div className="flex flex-col gap-1.5 sm:w-52">
        <label htmlFor={statusId} className="text-sm font-medium text-fg">
          {t("list.statusLabel")}
        </label>
        <Select
          id={statusId}
          value={status ?? ALL}
          onValueChange={(value) => {
            onStatusChange(value === ALL ? null : (value as StudentStatus));
          }}
          options={[
            { value: ALL, label: t("list.allStatuses") },
            ...STUDENT_STATUSES.map((value) => ({ value, label: t(`status.${value}`) })),
          ]}
        />
      </div>
      {active ? (
        <Button type="button" variant="ghost" onClick={onClear} className="sm:mb-0">
          <X aria-hidden="true" />
          {t("list.clearFilters")}
        </Button>
      ) : null}
    </div>
  );
}
