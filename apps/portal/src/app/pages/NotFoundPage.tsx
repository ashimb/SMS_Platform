import { Button } from "@school-platform/ui";
import { Compass, Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { openCommandPalette } from "@/app/layouts/shell/command-palette-events.ts";
import { StatusPage } from "@/shared/components/StatusPage.tsx";
import { ROUTES } from "@/shared/constants/routes.ts";

export function NotFoundPage() {
  const { t } = useTranslation("common");
  return (
    <StatusPage
      code="404"
      icon={<Compass aria-hidden="true" />}
      title={t("status.notFoundTitle")}
      description={<p>{t("status.notFoundBody")}</p>}
      actions={
        <>
          <Button asChild>
            <Link to={ROUTES.home}>{t("actions.goHome")}</Link>
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              openCommandPalette();
            }}
          >
            <Search aria-hidden="true" />
            {t("actions.search")}
          </Button>
        </>
      }
    />
  );
}

export default NotFoundPage;
