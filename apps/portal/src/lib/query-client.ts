/**
 * TanStack Query defaults.
 *
 * - Client errors (4xx) are never retried: retrying a 403/404/422 cannot succeed. A 401 has
 *   already been through the API client's single refresh-and-retry.
 * - Server and network errors retry twice with backoff.
 * - The cache is cleared whenever the session ends (see app/providers.tsx), so school data never
 *   outlives the signed-in user in memory.
 */
import { QueryClient } from "@tanstack/react-query";

import { isApiError } from "./api.ts";

const MAX_RETRIES = 2;

export function shouldRetry(failureCount: number, error: unknown): boolean {
  if (isApiError(error) && error.status >= 400 && error.status < 500) return false;
  return failureCount < MAX_RETRIES;
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        retry: shouldRetry,
        refetchOnWindowFocus: true,
      },
      mutations: { retry: false },
    },
  });
}
