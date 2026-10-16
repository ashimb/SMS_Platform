import { ClipboardCheck } from "lucide-react";
import { useTranslation } from "react-i18next";

import { ComingSoon } from "@/shared/components/ComingSoon.tsx";

/** Designed placeholder for the Exams module until it is built (FRD module EXM). */
export function ExamsComingSoon() {
  const { t } = useTranslation("features");
  return (
    <ComingSoon
      title={t("exams.title")}
      description={t("exams.description")}
      icon={<ClipboardCheck />}
      highlights={t("exams.highlights", { returnObjects: true }) as string[]}
    />
  );
}
