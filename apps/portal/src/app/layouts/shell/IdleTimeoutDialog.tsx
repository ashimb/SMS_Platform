/**
 * Idle-timeout warning (FRD FR-SEC-007): after inactivity, warn two minutes before signing out,
 * with "Stay signed in" (renews the session through the refresh cookie) and "Sign out".
 */
import { Button, Dialog, DialogContent, DialogFooter } from "@school-platform/ui";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import { auth } from "@/lib/auth-store.ts";
import { IDLE_TIMEOUT_MS, IDLE_WARNING_MS } from "@/shared/constants/session.ts";
import { useIdleTimer } from "@/shared/hooks/useIdleTimer.ts";

export function IdleTimeoutDialog({
  timeoutMs = IDLE_TIMEOUT_MS,
  warningMs = IDLE_WARNING_MS,
}: {
  timeoutMs?: number;
  warningMs?: number;
}) {
  const { t } = useTranslation("common");
  const onTimeout = useCallback(() => {
    void auth.logout("idle");
  }, []);
  const { warning, secondsLeft, reset } = useIdleTimer({
    enabled: true,
    timeoutMs,
    warningMs,
    onTimeout,
  });

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = String(secondsLeft % 60).padStart(2, "0");

  const stay = () => {
    reset();
    void auth.keepAlive().then((ok) => {
      if (!ok) void auth.logout("expired");
    });
  };

  return (
    <Dialog
      open={warning}
      onOpenChange={(open) => {
        if (!open) stay();
      }}
    >
      <DialogContent
        size="sm"
        role="alertdialog"
        title={t("idle.title")}
        description={t("idle.body")}
        closeLabel={t("idle.stay")}
      >
        <p
          className="text-center font-display text-4xl font-semibold text-fg tabular-nums"
          aria-hidden="true"
        >
          {minutes}:{seconds}
        </p>
        <p className="sr-only" aria-live="polite">
          {secondsLeft % 30 === 0 || secondsLeft <= 10
            ? t("idle.countdown", { seconds: secondsLeft })
            : ""}
        </p>
        <DialogFooter className="mt-6">
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              void auth.logout();
            }}
          >
            {t("user.signOut")}
          </Button>
          <Button type="button" onClick={stay}>
            {t("idle.stay")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
