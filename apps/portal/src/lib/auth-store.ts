/**
 * Authentication state (Zustand) and the API client bound to it.
 *
 * Security model (Master Rules, FRD FR-SEC-005):
 * - The access token and the signed-in user live in this store's memory only. Nothing is written
 *   to localStorage, sessionStorage, IndexedDB or JS-readable cookies (asserted by tests).
 * - The refresh token is an HttpOnly cookie the browser sends to /api/v1/auth/*; JS never sees it.
 * - On app load `init()` performs a silent refresh with that cookie, so a reload keeps the session
 *   without storing anything. The refresh is single-flight: the API client shares one in-flight
 *   refresh between `init()`, "Stay signed in" and every 401 retry.
 * - If a refresh fails, the session ends everywhere in the app (`status: "anonymous"`); providers
 *   clear the query cache so no school data stays in memory after sign-out.
 * - The MFA token from step one of sign-in is held in memory for its short lifetime only.
 *
 * Client-side state is for UX; the API enforces authentication and authorization on every call.
 */
import { createStore, type StoreApi, useStore } from "zustand";

import {
  ApiError,
  createPortalApi,
  type PortalApi,
  type Schemas,
  toApiError,
  unwrap,
} from "./api.ts";

export type AuthStatus = "unknown" | "authenticated" | "anonymous";
/** Why the last session ended; shown on the sign-in page. */
export type SessionEndReason = "signed_out" | "expired" | "idle";
export type CurrentUser = Schemas["MeResponse"];

export interface PendingMfa {
  token: string;
  expiresAt: number;
}

export interface AuthState {
  status: AuthStatus;
  accessToken: string | null;
  user: CurrentUser | null;
  pendingMfa: PendingMfa | null;
  endReason: SessionEndReason | null;
}

export type SignInResult = { kind: "ok" } | { kind: "mfa" } | { kind: "error"; error: ApiError };

export interface AuthController {
  store: StoreApi<AuthState>;
  api: PortalApi;
  /** Silent sign-in from the refresh cookie. Idempotent; safe to call from anywhere. */
  init: () => Promise<void>;
  login: (email: string, password: string) => Promise<SignInResult>;
  verifyMfa: (code: string) => Promise<SignInResult>;
  /** Renew the session now ("Stay signed in"). Resolves false if the session has ended. */
  keepAlive: () => Promise<boolean>;
  logout: (reason?: SessionEndReason) => Promise<void>;
  /** Back to the initial state without calling the API (tests). */
  reset: () => void;
}

const initialState: AuthState = {
  status: "unknown",
  accessToken: null,
  user: null,
  pendingMfa: null,
  endReason: null,
};

function networkError(cause: unknown): ApiError {
  return new ApiError({
    status: 0,
    code: "NETWORK_ERROR",
    message: cause instanceof Error ? cause.message : "Network request failed",
  });
}

export function createAuthController(options: { fetch?: typeof fetch } = {}): AuthController {
  const store = createStore<AuthState>()(() => ({ ...initialState }));
  // Resolve fetch per call so test interceptors (MSW) installed later are honoured.
  const fetchImpl = options.fetch ?? ((input, init) => globalThis.fetch(input, init));

  function endSession(reason: SessionEndReason): void {
    const { status, endReason } = store.getState();
    store.setState({
      status: "anonymous",
      accessToken: null,
      user: null,
      pendingMfa: null,
      // Only a session that was live gets a new reason; a late failed refresh after sign-out
      // must not erase why the user was signed out.
      endReason: status === "authenticated" ? reason : status === "anonymous" ? endReason : null,
    });
  }

  const api = createPortalApi(
    () => store.getState().accessToken,
    (token) => {
      if (token) store.setState({ accessToken: token });
      else endSession("expired");
    },
    { fetch: fetchImpl },
  );

  async function loadUser(): Promise<void> {
    const user = await unwrap(api.GET("/api/v1/auth/me"));
    store.setState({ user, status: "authenticated", pendingMfa: null, endReason: null });
  }

  let initPromise: Promise<void> | null = null;

  function init(): Promise<void> {
    initPromise ??= (async () => {
      if (store.getState().status !== "unknown") return;
      const token = await api.refreshAccessToken();
      if (!token) {
        endSession("expired");
        return;
      }
      try {
        await loadUser();
      } catch {
        endSession("expired");
      }
    })();
    return initPromise;
  }

  async function completeSignIn(accessToken: string): Promise<SignInResult> {
    store.setState({ accessToken });
    try {
      await loadUser();
      return { kind: "ok" };
    } catch (error) {
      store.setState({ accessToken: null });
      return { kind: "error", error: error instanceof ApiError ? error : networkError(error) };
    }
  }

  async function login(email: string, password: string): Promise<SignInResult> {
    try {
      const { data, error, response } = await api.POST("/api/v1/auth/login", {
        body: { email, password },
      });
      if (!data) return { kind: "error", error: toApiError(error, response) };
      if (data.status === "mfa_required") {
        store.setState({
          pendingMfa: { token: data.mfa_token, expiresAt: Date.now() + data.expires_in * 1000 },
        });
        return { kind: "mfa" };
      }
      return await completeSignIn(data.access_token);
    } catch (cause) {
      return { kind: "error", error: networkError(cause) };
    }
  }

  async function verifyMfa(code: string): Promise<SignInResult> {
    const pending = store.getState().pendingMfa;
    if (!pending || pending.expiresAt <= Date.now()) {
      store.setState({ pendingMfa: null });
      return {
        kind: "error",
        error: new ApiError({ status: 401, code: "MFA_EXPIRED", message: "MFA step expired" }),
      };
    }
    try {
      const { data, error, response } = await api.POST("/api/v1/auth/mfa/challenge", {
        body: { mfa_token: pending.token, code },
      });
      if (!data) return { kind: "error", error: toApiError(error, response) };
      return await completeSignIn(data.access_token);
    } catch (cause) {
      return { kind: "error", error: networkError(cause) };
    }
  }

  async function keepAlive(): Promise<boolean> {
    return (await api.refreshAccessToken()) !== null;
  }

  async function logout(reason: SessionEndReason = "signed_out"): Promise<void> {
    try {
      // Revokes the refresh-token family server-side and clears the cookie.
      await api.POST("/api/v1/auth/logout", { headers: { "X-SP-CSRF": "1" } });
    } catch {
      // Offline or API down: still end the local session; the refresh token expires on its own.
    } finally {
      endSession(reason);
      initPromise = Promise.resolve();
    }
  }

  function reset(): void {
    initPromise = null;
    store.setState({ ...initialState }, true);
  }

  return { store, api, init, login, verifyMfa, keepAlive, logout, reset };
}

/** The app-wide instance. Tests create isolated ones with `createAuthController()`. */
export const auth = createAuthController();
export const api = auth.api;

export function useAuth<T>(selector: (state: AuthState) => T): T {
  return useStore(auth.store, selector);
}
