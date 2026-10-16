import { Button } from "@school-platform/ui";
import { LogOut, UserRound } from "lucide-react";
import { useTranslation } from "react-i18next";

import { auth } from "@/lib/auth-store.ts";
import { StatusPage } from "@/shared/components/StatusPage.tsx";

/** Signed in, but the account has no portal role yet (e.g. a new staff account). */
export function NoAccessPage() {
  const { t } = useTranslation("common");
  return (
    <main id="main" className="flex min-h-dvh items-center bg-bg">
      <StatusPage
        code="—"
        icon={<UserRound aria-hidden="true" />}
        title={t("status.noAccessTitle")}
        description={<p>{t("status.noAccessBody")}</p>}
        actions={
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              void auth.logout();
            }}
          >
            <LogOut aria-hidden="true" />
            {t("user.signOut")}
          </Button>
        }
      />
    </main>
  );
}
