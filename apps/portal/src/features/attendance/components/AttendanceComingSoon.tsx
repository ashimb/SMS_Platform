import { CalendarCheck } from "lucide-react";
import { useTranslation } from "react-i18next";

import { ComingSoon } from "@/shared/components/ComingSoon.tsx";

/** Designed placeholder for the Attendance module until it is built (FRD module ATT). */
export function AttendanceComingSoon() {
  const { t } = useTranslation("features");
  return (
    <ComingSoon
      title={t("attendance.title")}
      description={t("attendance.description")}
      icon={<CalendarCheck />}
      highlights={t("attendance.highlights", { returnObjects: true }) as string[]}
    />
  );
}
