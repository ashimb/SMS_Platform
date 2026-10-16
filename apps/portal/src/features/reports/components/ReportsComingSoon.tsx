import { ChartColumn } from "lucide-react";
import { useTranslation } from "react-i18next";

import { ComingSoon } from "@/shared/components/ComingSoon.tsx";

/** Designed placeholder for the Reports module until it is built (FRD module RPT). */
export function ReportsComingSoon() {
  const { t } = useTranslation("features");
  return (
    <ComingSoon
      title={t("reports.title")}
      description={t("reports.description")}
      icon={<ChartColumn />}
      highlights={t("reports.highlights", { returnObjects: true }) as string[]}
    />
  );
}
