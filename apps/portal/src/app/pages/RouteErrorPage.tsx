import { useMemo } from "react";
import { isRouteErrorResponse, useRouteError } from "react-router-dom";

import { ErrorFallback, errorReference } from "@/shared/components/ErrorBoundary.tsx";

import { NotFoundPage } from "./NotFoundPage.tsx";

/** Router-level error element: 404s get the designed page, everything else the error fallback. */
export function RouteErrorPage() {
  const error = useRouteError();
  const reference = useMemo(() => errorReference(error), [error]);

  if (isRouteErrorResponse(error) && error.status === 404) return <NotFoundPage />;

  console.error(`[portal] route error ref=${reference}`, error);
  return (
    <main id="main" className="min-h-dvh bg-bg">
      <ErrorFallback
        error={error}
        reference={reference}
        onRetry={() => {
          window.location.reload();
        }}
      />
    </main>
  );
}
