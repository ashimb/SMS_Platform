import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MOCK_MFA_CODE, MOCK_PASSWORD } from "@/test/mocks/data.ts";
import { mockSignedIn, mockState } from "@/test/mocks/handlers.ts";

import { unwrap } from "./api.ts";
import { auth } from "./auth-store.ts";

/**
 * Watches every client-side persistence API the token could leak into: Web Storage (both
 * areas), JS-written cookies and IndexedDB. Any write fails the test.
 */
function watchPersistence() {
  const setItem = vi.spyOn(Storage.prototype, "setItem");
  const cookieSetter = vi.fn();
  const cookieDescriptor = Object.getOwnPropertyDescriptor(Document.prototype, "cookie");
  Object.defineProperty(document, "cookie", {
    configurable: true,
    get: () => "",
    set: cookieSetter,
  });
  const idbOpen = vi.fn();
  vi.stubGlobal("indexedDB", { open: idbOpen });
  return {
    assertNothingWritten(tokens: string[]) {
      expect(setItem).not.toHaveBeenCalled();
      expect(cookieSetter).not.toHaveBeenCalled();
      expect(idbOpen).not.toHaveBeenCalled();
      const stored = [
        ...Object.values({ ...window.localStorage }),
        ...Object.values({ ...window.sessionStorage }),
      ].join("\n");
      for (const token of tokens) expect(stored).not.toContain(token);
    },
    restore() {
      if (cookieDescriptor) delete (document as { cookie?: string }).cookie;
      vi.unstubAllGlobals();
    },
  };
}

describe("auth store", () => {
  let persistence: ReturnType<typeof watchPersistence>;

  beforeEach(() => {
    persistence = watchPersistence();
  });
  afterEach(() => {
    persistence.restore();
  });

  it("keeps the access token and user in memory only (no web storage, cookies or IndexedDB)", async () => {
    const result = await auth.login("admin@school.test", MOCK_PASSWORD);
    expect(result.kind).toBe("ok");

    const state = auth.store.getState();
    expect(state.status).toBe("authenticated");
    expect(state.accessToken).toMatch(/^at\./);
    expect(state.user?.email).toBe("admin@school.test");

    // Exercise refresh and sign-out too: no step may persist anything.
    const firstToken = state.accessToken ?? "";
    await auth.keepAlive();
    const secondToken = auth.store.getState().accessToken ?? "";
    await auth.logout();

    persistence.assertNothingWritten([firstToken, secondToken]);
    expect(window.localStorage.length).toBe(0);
    expect(window.sessionStorage.length).toBe(0);
  });

  it("restores the session silently on app load from the refresh cookie", async () => {
    mockSignedIn("teacher@school.test");
    await auth.init();
    const state = auth.store.getState();
    expect(state.status).toBe("authenticated");
    expect(state.user?.roles).toEqual(["teacher"]);
    persistence.assertNothingWritten([state.accessToken ?? ""]);
  });

  it("is anonymous (without a 'session ended' notice) when there is no cookie session", async () => {
    await auth.init();
    expect(auth.store.getState()).toMatchObject({
      status: "anonymous",
      endReason: null,
      user: null,
    });
  });

  it("init() is idempotent: concurrent calls share one refresh", async () => {
    mockSignedIn("admin@school.test");
    await Promise.all([auth.init(), auth.init(), auth.init()]);
    expect(mockState.refreshCount).toBe(1);
  });

  it("single-flight refresh: concurrent 401s trigger exactly one refresh, then all retry", async () => {
    mockSignedIn("admin@school.test");
    await auth.init();
    expect(mockState.refreshCount).toBe(1);

    // The access token expires server-side; the refresh-cookie session is still valid.
    mockState.accessTokens.clear();
    const results = await Promise.all(
      Array.from({ length: 5 }, (_, page) =>
        unwrap(
          auth.api.GET("/api/v1/students", { params: { query: { page: page + 1, page_size: 5 } } }),
        ),
      ),
    );

    expect(results.map((r) => r.items.length)).toEqual([5, 5, 5, 5, 5]);
    expect(mockState.refreshCount).toBe(2);
    expect(auth.store.getState().status).toBe("authenticated");
  });

  it("signs out automatically when the refresh fails", async () => {
    mockSignedIn("admin@school.test");
    await auth.init();

    // Both the access token and the refresh session are gone (e.g. revoked elsewhere).
    mockState.accessTokens.clear();
    mockState.session = null;
    const { response } = await auth.api.GET("/api/v1/auth/me");

    expect(response.status).toBe(401);
    expect(auth.store.getState()).toMatchObject({
      status: "anonymous",
      accessToken: null,
      user: null,
      endReason: "expired",
    });
  });

  it("returns an error and stores nothing on bad credentials", async () => {
    const result = await auth.login("admin@school.test", "wrong-password-123");
    expect(result.kind).toBe("error");
    if (result.kind === "error") expect(result.error.status).toBe(401);
    expect(auth.store.getState()).toMatchObject({
      status: "unknown",
      accessToken: null,
      user: null,
    });
  });

  it("completes the MFA step with the in-memory MFA token", async () => {
    const first = await auth.login("principal@school.test", MOCK_PASSWORD);
    expect(first.kind).toBe("mfa");
    expect(auth.store.getState().pendingMfa?.token).toMatch(/^mfa\./);

    const wrong = await auth.verifyMfa("000000");
    expect(wrong.kind).toBe("error");
    if (wrong.kind === "error") expect(wrong.error.code).toBe("MFA_INVALID");

    const ok = await auth.verifyMfa(MOCK_MFA_CODE);
    expect(ok.kind).toBe("ok");
    expect(auth.store.getState()).toMatchObject({ status: "authenticated", pendingMfa: null });
    persistence.assertNothingWritten([auth.store.getState().accessToken ?? ""]);
  });

  it("logout revokes the server session and clears memory", async () => {
    await auth.login("admin@school.test", MOCK_PASSWORD);
    await auth.logout();
    expect(mockState.session).toBeNull();
    expect(auth.store.getState()).toMatchObject({
      status: "anonymous",
      accessToken: null,
      user: null,
      endReason: "signed_out",
    });
  });
});
