/**
 * Typed SchoolPlatform API client (openapi-fetch + schema generated from the API's OpenAPI).
 *
 *   const tokens = createMemoryTokenStore();
 *   const api = createApiClient("https://portal.example.in", tokens.get, (token) => {
 *     if (token) tokens.set(token); else { tokens.clear(); redirectToLogin(); }
 *   });
 *   const { data, error } = await api.GET("/api/v1/students", { params: { query: { page: 1 } } });
 *
 * Token handling (Master Rules / FRD FR-SEC-005):
 * - The access token lives only in memory (`getToken`), never in localStorage, sessionStorage,
 *   IndexedDB, or cookies written by JavaScript.
 * - The refresh token is an HttpOnly cookie the browser sends to the refresh endpoint; this
 *   client never sees it.
 * - On 401, one refresh request is made no matter how many calls failed at the same time
 *   (single flight), then each failed request is retried once with the new token. If refresh
 *   fails, `onRefresh(null)` tells the app the session has ended.
 * - `client.refreshAccessToken()` runs the same single-flight refresh on demand (silent sign-in
 *   on app load, "Stay signed in"), so it never races a 401-triggered refresh.
 */
import createClient, { type Client, type Middleware } from "openapi-fetch";

import type { paths } from "./generated/schema.js";

export type { components, operations, paths } from "./generated/schema.js";

/** openapi-fetch client plus the shared single-flight refresh. */
export type ApiClient<P extends object = paths> = Client<P> & {
  /** Refresh the access token via the HttpOnly cookie; resolves to the new token or null. */
  refreshAccessToken: () => Promise<string | null>;
};
export type GetToken = () => string | null | undefined;
/** Receives the new access token after a refresh, or null when the session could not be renewed. */
export type OnRefresh = (token: string | null) => void;

export interface ApiClientOptions {
  /** Custom fetch (tests, SSR). Defaults to globalThis.fetch. */
  fetch?: typeof globalThis.fetch;
  /** Refresh endpoint path (cookie-authenticated). */
  refreshPath?: string;
  /** CSRF header the API requires on cookie-authenticated endpoints. */
  csrfHeader?: string;
}

/** Endpoints where a 401 means "bad credentials", not "expired access token". */
const AUTH_PATHS = ["/auth/login", "/auth/refresh", "/auth/logout", "/auth/mfa/challenge"];

function isAuthEndpoint(url: string): boolean {
  const { pathname } = new URL(url);
  return AUTH_PATHS.some((path) => pathname.endsWith(path));
}

/**
 * @typeParam P - OpenAPI paths. Defaults to the generated API schema; apps may widen it with
 *   endpoints the API does not serve yet (typed from the FRD), e.g. `paths & PendingPaths`.
 */
export function createApiClient<P extends object = paths>(
  baseUrl: string,
  getToken: GetToken,
  onRefresh: OnRefresh,
  options: ApiClientOptions = {},
): ApiClient<P> {
  const fetchImpl = options.fetch ?? globalThis.fetch.bind(globalThis);
  const refreshPath = options.refreshPath ?? "/api/v1/auth/refresh";
  const csrfHeader = options.csrfHeader ?? "X-SP-CSRF";

  /** Clones of outgoing requests, kept until the response arrives, so they can be replayed. */
  const pending = new Map<string, Request>();
  let refreshInFlight: Promise<string | null> | null = null;

  function refreshAccessToken(): Promise<string | null> {
    refreshInFlight ??= (async () => {
      try {
        const response = await fetchImpl(new URL(refreshPath, baseUrl), {
          method: "POST",
          credentials: "include",
          headers: { [csrfHeader]: "1", Accept: "application/json" },
        });
        if (!response.ok) {
          onRefresh(null);
          return null;
        }
        const body = (await response.json()) as { access_token?: unknown };
        const token = typeof body.access_token === "string" ? body.access_token : null;
        onRefresh(token);
        return token;
      } catch {
        onRefresh(null);
        return null;
      } finally {
        refreshInFlight = null;
      }
    })();
    return refreshInFlight;
  }

  const authMiddleware: Middleware = {
    onRequest({ request, id }) {
      const token = getToken();
      if (token) request.headers.set("Authorization", `Bearer ${token}`);
      if (!isAuthEndpoint(request.url)) pending.set(id, request.clone());
      return request;
    },

    async onResponse({ request, response, id }) {
      const original = pending.get(id);
      pending.delete(id);
      if (response.status !== 401 || !original || isAuthEndpoint(request.url)) return response;

      const token = await refreshAccessToken();
      if (!token) return response;

      const retry = new Request(original);
      retry.headers.set("Authorization", `Bearer ${token}`);
      // Retried once only: the retry goes straight to fetch, not back through this middleware.
      return fetchImpl(retry);
    },

    onError({ id }) {
      pending.delete(id);
    },
  };

  const client = createClient<P>({ baseUrl, fetch: fetchImpl, credentials: "same-origin" });
  client.use(authMiddleware);
  return Object.assign(client, { refreshAccessToken });
}

/** Minimal in-memory access-token holder (lost on reload by design; refresh restores it). */
export interface MemoryTokenStore {
  get: GetToken;
  set: (token: string) => void;
  clear: () => void;
}

export function createMemoryTokenStore(): MemoryTokenStore {
  let token: string | null = null;
  return {
    get: () => token,
    set: (value) => {
      token = value;
    },
    clear: () => {
      token = null;
    },
  };
}
