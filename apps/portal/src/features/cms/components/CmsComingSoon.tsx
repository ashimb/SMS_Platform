import { Globe } from "lucide-react";
import { useTranslation } from "react-i18next";

import { ComingSoon } from "@/shared/components/ComingSoon.tsx";

/** Designed placeholder for the Cms module until it is built (FRD module CMS). */
export function CmsComingSoon() {
  const { t } = useTranslation("features");
  return (
    <ComingSoon
      title={t("cms.title")}
      description={t("cms.description")}
      icon={<Globe />}
      highlights={t("cms.highlights", { returnObjects: true }) as string[]}
    />
  );
}
