import { Briefcase } from "lucide-react";
import { useTranslation } from "react-i18next";

import { ComingSoon } from "@/shared/components/ComingSoon.tsx";

/** Designed placeholder for the Staff module until it is built (FRD module STF). */
export function StaffComingSoon() {
  const { t } = useTranslation("features");
  return (
    <ComingSoon
      title={t("staff.title")}
      description={t("staff.description")}
      icon={<Briefcase />}
      highlights={t("staff.highlights", { returnObjects: true }) as string[]}
    />
  );
}
