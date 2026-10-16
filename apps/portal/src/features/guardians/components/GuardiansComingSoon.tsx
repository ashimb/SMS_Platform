import { BookUser } from "lucide-react";
import { useTranslation } from "react-i18next";

import { ComingSoon } from "@/shared/components/ComingSoon.tsx";

/** Designed placeholder for the Guardians module until it is built (FRD module GRD). */
export function GuardiansComingSoon() {
  const { t } = useTranslation("features");
  return (
    <ComingSoon
      title={t("guardians.title")}
      description={t("guardians.description")}
      icon={<BookUser />}
      highlights={t("guardians.highlights", { returnObjects: true }) as string[]}
    />
  );
}
