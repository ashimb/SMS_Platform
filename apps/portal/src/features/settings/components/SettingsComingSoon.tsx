import { Settings } from "lucide-react";
import { useTranslation } from "react-i18next";

import { ComingSoon } from "@/shared/components/ComingSoon.tsx";

/** Designed placeholder for the Settings module until it is built (FRD module CFG / TEN). */
export function SettingsComingSoon() {
  const { t } = useTranslation("features");
  return (
    <ComingSoon
      title={t("settings.title")}
      description={t("settings.description")}
      icon={<Settings />}
      highlights={t("settings.highlights", { returnObjects: true }) as string[]}
    />
  );
}
