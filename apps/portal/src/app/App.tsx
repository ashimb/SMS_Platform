import { Suspense, useState } from "react";
import { RouterProvider } from "react-router-dom";

import { ErrorBoundary } from "@/shared/components/ErrorBoundary.tsx";
import { FullPageLoader } from "@/shared/components/FullPageLoader.tsx";

import { Providers } from "./providers.tsx";
import { createAppRouter } from "./router.tsx";

export function App() {
  const [router] = useState(createAppRouter);
  return (
    <ErrorBoundary>
      <Providers>
        {/* Translations load in parallel with the first route; render waits here, not before. */}
        <Suspense fallback={<FullPageLoader />}>
          <RouterProvider router={router} />
        </Suspense>
      </Providers>
    </ErrorBoundary>
  );
}
