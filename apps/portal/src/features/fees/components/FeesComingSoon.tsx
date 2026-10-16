import { Wallet } from "lucide-react";
import { useTranslation } from "react-i18next";

import { ComingSoon } from "@/shared/components/ComingSoon.tsx";

/** Designed placeholder for the Fees module until it is built (FRD module FIN). */
export function FeesComingSoon() {
  const { t } = useTranslation("features");
  return (
    <ComingSoon
      title={t("fees.title")}
      description={t("fees.description")}
      icon={<Wallet />}
      highlights={t("fees.highlights", { returnObjects: true }) as string[]}
    />
  );
}
