import { Button } from "@school-platform/ui";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";

import { StatusPage } from "@/shared/components/StatusPage.tsx";
import { ROUTES } from "@/shared/constants/routes.ts";

export function ForbiddenPage() {
  const { t } = useTranslation("common");
  const navigate = useNavigate();
  return (
    <StatusPage
      code="403"
      icon={<ShieldAlert aria-hidden="true" />}
      title={t("status.forbiddenTitle")}
      description={<p>{t("status.forbiddenBody")}</p>}
      actions={
        <>
          <Button asChild>
            <Link to={ROUTES.home}>{t("actions.goHome")}</Link>
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              void navigate(-1);
            }}
          >
            <ArrowLeft aria-hidden="true" />
            {t("actions.goBack")}
          </Button>
        </>
      }
    />
  );
}
