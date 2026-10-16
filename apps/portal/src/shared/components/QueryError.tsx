import { Button, EmptyState } from "@school-platform/ui";
import { CircleAlert, RefreshCw, WifiOff } from "lucide-react";
import { useTranslation } from "react-i18next";

import { isApiError } from "@/lib/api.ts";

import { errorReference } from "./ErrorBoundary.tsx";
import { TraceId } from "./TraceId.tsx";

/** Inline error state for a failed query: plain-language reason, retry, and support reference. */
export function QueryError({
  error,
  onRetry,
  title,
}: {
  error: unknown;
  onRetry?: () => void;
  title?: string;
}) {
  const { t } = useTranslation("common");
  const offline = isApiError(error, 0);
  const forbidden = isApiError(error, 403);
  const description = offline
    ? t("errors.offline")
    : forbidden
      ? t("errors.forbiddenBody")
      : t("errors.loadFailed");

  return (
    <EmptyState
      tone="error"
      icon={offline ? <WifiOff /> : <CircleAlert />}
      title={title ?? t("errors.loadFailedTitle")}
      description={
        <span className="flex flex-col items-center gap-3">
          <span>{description}</span>
          {!offline ? <TraceId value={errorReference(error)} /> : null}
        </span>
      }
      action={
        onRetry && !forbidden ? (
          <Button type="button" variant="secondary" onClick={onRetry}>
            <RefreshCw aria-hidden="true" />
            {t("actions.tryAgain")}
          </Button>
        ) : undefined
      }
    />
  );
}
