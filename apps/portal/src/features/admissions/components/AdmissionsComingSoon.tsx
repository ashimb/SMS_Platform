import { UserPlus } from "lucide-react";
import { useTranslation } from "react-i18next";

import { ComingSoon } from "@/shared/components/ComingSoon.tsx";

/** Designed placeholder for the Admissions module until it is built (FRD module ADM). */
export function AdmissionsComingSoon() {
  const { t } = useTranslation("features");
  return (
    <ComingSoon
      title={t("admissions.title")}
      description={t("admissions.description")}
      icon={<UserPlus />}
      highlights={t("admissions.highlights", { returnObjects: true }) as string[]}
    />
  );
}
