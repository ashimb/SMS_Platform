import { Avatar, Card } from "@school-platform/ui";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { ageOn, formatDate, formatDateTime, toAppLocale } from "@/shared/utils/format.ts";

import type { Student } from "../types.ts";
import { classLabel, fullName, StudentStatusBadge } from "./StudentStatusBadge.tsx";

function Item({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1">
      <dt className="text-xs font-medium tracking-wide text-fg-subtle uppercase">{label}</dt>
      <dd className="text-sm text-fg">{children}</dd>
    </div>
  );
}

/** Read-only student profile (core identity fields; C4 groups arrive with field encryption). */
export function StudentProfile({ student }: { student: Student }) {
  const { t, i18n } = useTranslation("students");
  const locale = toAppLocale(i18n.language);
  const name = fullName(student);
  const age = ageOn(student.date_of_birth);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="flex flex-col items-center gap-3 p-6 text-center">
        <Avatar name={name} size="lg" />
        <div className="space-y-1">
          <p className="font-display text-lg font-semibold text-fg">{name}</p>
          <p className="font-mono text-xs text-fg-muted">{student.admission_no}</p>
        </div>
        <StudentStatusBadge status={student.status} />
        <p className="text-sm text-fg-muted">{classLabel(student) ?? t("detail.noClass")}</p>
      </Card>
      <Card className="p-6 lg:col-span-2">
        <h2 className="mb-5 font-display text-base font-semibold text-fg">{t("detail.profile")}</h2>
        <dl className="grid gap-5 sm:grid-cols-2">
          <Item label={t("fields.firstName")}>{student.first_name}</Item>
          <Item label={t("fields.middleName")}>{student.middle_name ?? "—"}</Item>
          <Item label={t("fields.lastName")}>{student.last_name ?? "—"}</Item>
          <Item label={t("fields.gender")}>
            {t(`gender.${student.gender}`, { defaultValue: student.gender })}
          </Item>
          <Item label={t("fields.dateOfBirth")}>
            {formatDate(student.date_of_birth, locale)}
            {age !== null ? (
              <span className="text-fg-muted"> · {t("detail.age", { count: age })}</span>
            ) : null}
          </Item>
          <Item label={t("fields.admissionDate")}>
            {formatDate(student.admission_date, locale)}
          </Item>
          <Item label={t("fields.grade")}>{student.current_grade ?? "—"}</Item>
          <Item label={t("fields.section")}>{student.section ?? "—"}</Item>
        </dl>
        <p className="mt-6 border-t border-border pt-4 text-xs text-fg-subtle">
          {t("detail.updated", { time: formatDateTime(student.updated_at, locale) })}
        </p>
      </Card>
    </div>
  );
}
