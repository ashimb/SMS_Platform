import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createApiClient, createMemoryTokenStore } from "./index.ts";

const BASE = "https://portal.example.test";

interface FakeApi {
  fetch: typeof globalThis.fetch;
  calls: Request[];
  refreshCalls: () => number;
}

/** Fake API: `validToken` is accepted; /auth/refresh issues `nextToken` (or fails). */
function fakeApi(options: {
  validToken: string;
  nextToken?: string | null;
  refreshDelayMs?: number;
}): FakeApi {
  const calls: Request[] = [];
  let valid = options.validToken;
  const fetchImpl = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const request = input instanceof Request ? input : new Request(input, init);
    calls.push(request);
    const { pathname } = new URL(request.url);

    if (pathname === "/api/v1/auth/refresh") {
      if (options.refreshDelayMs) await new Promise((r) => setTimeout(r, options.refreshDelayMs));
      if (!options.nextToken)
        return Response.json({ error: { code: "INVALID_TOKEN" } }, { status: 401 });
      valid = options.nextToken;
      return Response.json({
        status: "ok",
        access_token: options.nextToken,
        token_type: "bearer",
        expires_in: 600,
      });
    }
    if (pathname === "/api/v1/auth/login") {
      return Response.json({ error: { code: "INVALID_CREDENTIALS" } }, { status: 401 });
    }
    if (request.headers.get("Authorization") !== `Bearer ${valid}`) {
      return Response.json({ error: { code: "INVALID_TOKEN" } }, { status: 401 });
    }
    const body = request.method === "POST" ? await request.text() : null;
    return Response.json({ ok: true, path: pathname, body });
  };
  return {
    fetch: fetchImpl as typeof globalThis.fetch,
    calls,
    refreshCalls: () =>
      calls.filter((c) => new URL(c.url).pathname === "/api/v1/auth/refresh").length,
  };
}

describe("createApiClient", () => {
  let storageSpy: { getItem: ReturnType<typeof vi.fn>; setItem: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    storageSpy = { getItem: vi.fn(), setItem: vi.fn() };
    vi.stubGlobal("localStorage", storageSpy);
    vi.stubGlobal("sessionStorage", storageSpy);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("attaches the in-memory access token", async () => {
    const api = fakeApi({ validToken: "t1" });
    const client = createApiClient(BASE, () => "t1", vi.fn(), { fetch: api.fetch });
    const { data, response } = await client.GET("/api/v1/auth/me");
    expect(response.status).toBe(200);
    expect(data).toBeTruthy();
    expect(api.calls[0]?.headers.get("Authorization")).toBe("Bearer t1");
  });

  it("sends no Authorization header when there is no token", async () => {
    const api = fakeApi({ validToken: "t1" });
    const client = createApiClient(BASE, () => null, vi.fn(), { fetch: api.fetch });
    await client.GET("/api/v1/tenant");
    expect(api.calls[0]?.headers.has("Authorization")).toBe(false);
  });

  it("refreshes once on 401 and retries with the new token", async () => {
    const api = fakeApi({ validToken: "expired-replaced", nextToken: "t2" });
    const store = createMemoryTokenStore();
    store.set("t1-expired");
    const onRefresh = vi.fn((token: string | null) => {
      if (token) store.set(token);
    });
    const client = createApiClient(BASE, store.get, onRefresh, { fetch: api.fetch });

    const { response } = await client.GET("/api/v1/students");
    expect(response.status).toBe(200);
    expect(onRefresh).toHaveBeenCalledWith("t2");
    expect(store.get()).toBe("t2");
    expect(api.refreshCalls()).toBe(1);
    const last = api.calls.at(-1);
    expect(last?.headers.get("Authorization")).toBe("Bearer t2");
  });

  it("uses the cookie-based refresh endpoint with credentials and the CSRF header", async () => {
    const api = fakeApi({ validToken: "x", nextToken: "t2" });
    const client = createApiClient(BASE, () => "old", vi.fn(), { fetch: api.fetch });
    await client.GET("/api/v1/students");
    const refresh = api.calls.find((c) => new URL(c.url).pathname === "/api/v1/auth/refresh");
    expect(refresh?.method).toBe("POST");
    expect(refresh?.credentials).toBe("include");
    expect(refresh?.headers.get("X-SP-CSRF")).toBe("1");
    expect(refresh?.headers.has("Authorization")).toBe(false);
  });

  it("single-flight: concurrent 401s trigger exactly one refresh", async () => {
    const api = fakeApi({ validToken: "x", nextToken: "t2", refreshDelayMs: 20 });
    let token = "old";
    const onRefresh = vi.fn((next: string | null) => {
      if (next) token = next;
    });
    const client = createApiClient(BASE, () => token, onRefresh, { fetch: api.fetch });

    const results = await Promise.all([
      client.GET("/api/v1/students"),
      client.GET("/api/v1/users"),
      client.GET("/api/v1/roles"),
      client.GET("/api/v1/audit-logs"),
    ]);
    expect(results.map((r) => r.response.status)).toEqual([200, 200, 200, 200]);
    expect(api.refreshCalls()).toBe(1);
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it("when refresh fails: reports the ended session and returns the original 401 (no loop)", async () => {
    const api = fakeApi({ validToken: "never", nextToken: null });
    const onRefresh = vi.fn();
    const client = createApiClient(BASE, () => "old", onRefresh, { fetch: api.fetch });
    const { response, error } = await client.GET("/api/v1/students");
    expect(response.status).toBe(401);
    expect(error).toBeTruthy();
    expect(onRefresh).toHaveBeenCalledWith(null);
    expect(api.refreshCalls()).toBe(1);
    expect(api.calls).toHaveLength(2); // original + refresh, no retry
  });

  it("retries only once: a still-401 retry does not trigger another refresh", async () => {
    const api = fakeApi({ validToken: "server-wants-something-else", nextToken: "t2" });
    // The fake accepts t2 after refresh, so force a mismatch by never updating getToken's source:
    const client = createApiClient(BASE, () => "old", vi.fn(), {
      fetch: (async (input: RequestInfo | URL, init?: RequestInit) => {
        const response = await api.fetch(input, init);
        const url = new URL(input instanceof Request ? input.url : String(input));
        return url.pathname === "/api/v1/auth/refresh"
          ? response
          : new Response(null, { status: 401 });
      }) as typeof globalThis.fetch,
    });
    const { response } = await client.GET("/api/v1/students");
    expect(response.status).toBe(401);
    expect(api.refreshCalls()).toBe(1);
  });

  it("does not refresh for auth endpoints (a failed login is not an expired session)", async () => {
    const api = fakeApi({ validToken: "x", nextToken: "t2" });
    const onRefresh = vi.fn();
    const client = createApiClient(BASE, () => null, onRefresh, { fetch: api.fetch });
    const { response } = await client.POST("/api/v1/auth/login", {
      body: { email: "a@b.example.com", password: "wrong-password" },
    });
    expect(response.status).toBe(401);
    expect(api.refreshCalls()).toBe(0);
    expect(onRefresh).not.toHaveBeenCalled();
  });

  it("replays the request body on retry", async () => {
    const api = fakeApi({ validToken: "x", nextToken: "t2" });
    let token = "old";
    const client = createApiClient(
      BASE,
      () => token,
      (next) => {
        if (next) token = next;
      },
      { fetch: api.fetch },
    );
    const payload = {
      admission_no: "ADM/1",
      first_name: "Aarav",
      date_of_birth: "2015-01-01",
      gender: "male" as const,
      admission_date: "2026-04-01",
    };
    const { data } = await client.POST("/api/v1/students", { body: payload });
    expect((data as unknown as { body: string }).body).toBe(JSON.stringify(payload));
  });

  it("refreshAccessToken() shares the in-flight refresh with 401 retries", async () => {
    const api = fakeApi({ validToken: "x", nextToken: "t2", refreshDelayMs: 20 });
    let token = "old";
    const onRefresh = vi.fn((next: string | null) => {
      if (next) token = next;
    });
    const client = createApiClient(BASE, () => token, onRefresh, { fetch: api.fetch });

    const [manual, call] = await Promise.all([
      client.refreshAccessToken(),
      client.GET("/api/v1/students"),
    ]);
    expect(manual).toBe("t2");
    expect(call.response.status).toBe(200);
    expect(api.refreshCalls()).toBe(1);
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it("refreshAccessToken() resolves null and reports the ended session on failure", async () => {
    const api = fakeApi({ validToken: "x", nextToken: null });
    const onRefresh = vi.fn();
    const client = createApiClient(BASE, () => null, onRefresh, { fetch: api.fetch });
    await expect(client.refreshAccessToken()).resolves.toBeNull();
    expect(onRefresh).toHaveBeenCalledWith(null);
  });

  it("never touches web storage", async () => {
    const api = fakeApi({ validToken: "x", nextToken: "t2" });
    const client = createApiClient(BASE, () => "old", vi.fn(), { fetch: api.fetch });
    await client.GET("/api/v1/students");
    expect(storageSpy.getItem).not.toHaveBeenCalled();
    expect(storageSpy.setItem).not.toHaveBeenCalled();
  });
});

describe("createMemoryTokenStore", () => {
  it("holds the token in memory only", () => {
    const store = createMemoryTokenStore();
    expect(store.get()).toBeNull();
    store.set("abc");
    expect(store.get()).toBe("abc");
    store.clear();
    expect(store.get()).toBeNull();
  });
});
