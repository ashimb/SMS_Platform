import { Badge } from "@school-platform/ui";
import { useTranslation } from "react-i18next";

import type { StudentStatus } from "../types.ts";

const TONE: Record<StudentStatus, "success" | "info" | "warning" | "neutral"> = {
  enrolled: "success",
  provisional: "info",
  transferred: "warning",
  withdrawn: "neutral",
  alumni: "neutral",
};

/** Status shown as text plus colour, never colour alone (WCAG 1.4.1). */
export function StudentStatusBadge({ status }: { status: string }) {
  const { t } = useTranslation("students");
  const known = status in TONE ? (status as StudentStatus) : null;
  return (
    <Badge tone={known ? TONE[known] : "neutral"} dot>
      {known ? t(`status.${known}`) : status}
    </Badge>
  );
}

export function fullName(student: {
  first_name: string;
  middle_name: string | null;
  last_name: string | null;
}) {
  return [student.first_name, student.middle_name, student.last_name].filter(Boolean).join(" ");
}

export function classLabel(student: { current_grade: string | null; section: string | null }) {
  if (!student.current_grade) return null;
  return student.section ? `${student.current_grade}-${student.section}` : student.current_grade;
}
