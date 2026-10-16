/**
 * App-wide providers: TanStack Query, tenant branding, tooltips and toasts.
 *
 * When the session ends (sign-out, failed refresh, idle timeout) every cached query except the
 * public school profile is removed, so no school data remains in memory for the next person
 * using a shared device.
 */
import { Toaster, TooltipProvider } from "@school-platform/ui";
import { type QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, useEffect, useState } from "react";

import { auth } from "@/lib/auth-store.ts";
import { createQueryClient } from "@/lib/query-client.ts";

import { BrandingProvider, TENANT_QUERY_KEY } from "./branding.tsx";

export function clearPrivateQueries(queryClient: QueryClient): void {
  queryClient.removeQueries({
    predicate: (query) => query.queryKey[0] !== TENANT_QUERY_KEY[0],
  });
}

export function Providers({
  children,
  queryClient: provided,
}: {
  children: ReactNode;
  queryClient?: QueryClient;
}) {
  const [queryClient] = useState(() => provided ?? createQueryClient());

  useEffect(
    () =>
      auth.store.subscribe((state, previous) => {
        if (previous.status === "authenticated" && state.status !== "authenticated") {
          clearPrivateQueries(queryClient);
        }
      }),
    [queryClient],
  );

  return (
    <QueryClientProvider client={queryClient}>
      <BrandingProvider>
        <TooltipProvider delayDuration={300}>
          {children}
          <Toaster />
        </TooltipProvider>
      </BrandingProvider>
    </QueryClientProvider>
  );
}
