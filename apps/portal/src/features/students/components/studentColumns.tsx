import { Avatar } from "@school-platform/ui";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { createDataTableColumnHelper } from "@/shared/components/DataTable.tsx";
import { ROUTES } from "@/shared/constants/routes.ts";
import { formatDate, toAppLocale } from "@/shared/utils/format.ts";

import type { Student } from "../types.ts";
import { classLabel, fullName, StudentStatusBadge } from "./StudentStatusBadge.tsx";

const helper = createDataTableColumnHelper<Student>();

/** Column definitions for the students list (translated, locale-aware dates). */
export function useStudentColumns() {
  const { t, i18n } = useTranslation("students");
  const locale = toAppLocale(i18n.language);

  return useMemo(
    () => [
      helper.accessor((row) => fullName(row), {
        id: "name",
        header: t("fields.name"),
        cell: (info) => (
          <Link
            to={ROUTES.student(info.row.original.id)}
            className="flex min-h-11 items-center gap-3 rounded font-medium text-fg hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none md:pointer-fine:min-h-0"
          >
            <Avatar name={info.getValue()} size="sm" />
            <span className="truncate">{info.getValue()}</span>
          </Link>
        ),
      }),
      helper.accessor("admission_no", {
        header: t("fields.admissionNo"),
        cell: (info) => <span className="font-mono text-xs text-fg-muted">{info.getValue()}</span>,
      }),
      helper.accessor((row) => classLabel(row) ?? "—", { id: "class", header: t("fields.class") }),
      helper.accessor("status", {
        header: t("fields.status"),
        cell: (info) => <StudentStatusBadge status={info.getValue()} />,
      }),
      helper.accessor("admission_date", {
        header: t("fields.admissionDate"),
        cell: (info) => (
          <span className="whitespace-nowrap text-fg-muted">
            {formatDate(info.getValue(), locale)}
          </span>
        ),
      }),
    ],
    [t, locale],
  );
}
