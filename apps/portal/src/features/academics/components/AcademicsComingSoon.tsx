import { BookOpen } from "lucide-react";
import { useTranslation } from "react-i18next";

import { ComingSoon } from "@/shared/components/ComingSoon.tsx";

/** Designed placeholder for the Academics module until it is built (FRD module ACA). */
export function AcademicsComingSoon() {
  const { t } = useTranslation("features");
  return (
    <ComingSoon
      title={t("academics.title")}
      description={t("academics.description")}
      icon={<BookOpen />}
      highlights={t("academics.highlights", { returnObjects: true }) as string[]}
    />
  );
}
