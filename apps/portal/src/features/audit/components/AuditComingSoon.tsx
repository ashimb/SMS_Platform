import { ScrollText } from "lucide-react";
import { useTranslation } from "react-i18next";

import { ComingSoon } from "@/shared/components/ComingSoon.tsx";

/** Designed placeholder for the Audit module until it is built (FRD module AUD). */
export function AuditComingSoon() {
  const { t } = useTranslation("features");
  return (
    <ComingSoon
      title={t("audit.title")}
      description={t("audit.description")}
      icon={<ScrollText />}
      highlights={t("audit.highlights", { returnObjects: true }) as string[]}
    />
  );
}
