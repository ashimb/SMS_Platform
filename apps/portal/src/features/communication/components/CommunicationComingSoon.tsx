import { Megaphone } from "lucide-react";
import { useTranslation } from "react-i18next";

import { ComingSoon } from "@/shared/components/ComingSoon.tsx";

/** Designed placeholder for the Communication module until it is built (FRD module COM). */
export function CommunicationComingSoon() {
  const { t } = useTranslation("features");
  return (
    <ComingSoon
      title={t("communication.title")}
      description={t("communication.description")}
      icon={<Megaphone />}
      highlights={t("communication.highlights", { returnObjects: true }) as string[]}
    />
  );
}
