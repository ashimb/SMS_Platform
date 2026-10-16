import { CalendarDays } from "lucide-react";
import { useTranslation } from "react-i18next";

import { ComingSoon } from "@/shared/components/ComingSoon.tsx";

/** Designed placeholder for the Timetable module until it is built (FRD module TT). */
export function TimetableComingSoon() {
  const { t } = useTranslation("features");
  return (
    <ComingSoon
      title={t("timetable.title")}
      description={t("timetable.description")}
      icon={<CalendarDays />}
      highlights={t("timetable.highlights", { returnObjects: true }) as string[]}
    />
  );
}
