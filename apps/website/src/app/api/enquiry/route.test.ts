import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/enquiry/route.ts";
import { ENQUIRY_DEFAULTS } from "@/lib/enquiry-schema.ts";
import { resetEnvCache } from "@/lib/env.ts";
import { resetEnquiryLimiter } from "@/lib/rate-limit.ts";

const ORIGIN = "http://localhost:3000";
const payload = {
  ...ENQUIRY_DEFAULTS,
  guardianName: "Priya Nair",
  childName: "Ananya Nair",
  email: "priya@example.com",
  phone: "+91 98765 43210",
  grade: "Class VI",
  message: "Hello",
  consent: true,
};

function request(body: unknown, headers: Record<string, string> = {}): Request {
  return new Request(`${ORIGIN}/api/enquiry`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-sp-csrf": "1",
      origin: ORIGIN,
      host: "localhost:3000",
      "x-real-ip": "203.0.113.7",
      ...headers,
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.stubEnv("SITE_URL", ORIGIN);
  vi.stubEnv("WEBSITE_DATA_SOURCE", "mock");
  vi.stubEnv("ENQUIRY_RATE_LIMIT", "3");
  vi.spyOn(console, "info").mockImplementation(() => undefined);
  vi.spyOn(console, "warn").mockImplementation(() => undefined);
  resetEnvCache();
  resetEnquiryLimiter();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  resetEnvCache();
  resetEnquiryLimiter();
});

describe("POST /api/enquiry", () => {
  it("accepts a valid enquiry in mock mode and returns a reference", async () => {
    const response = await POST(request(payload));
    expect(response.status).toBe(202);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect((await response.json()) as { reference: string }).toEqual({
      reference: expect.stringMatching(/^ENQ-[0-9A-F]{8}$/),
    });
  });

  it("rejects non-JSON requests", async () => {
    const response = await POST(
      request("a=b", { "content-type": "application/x-www-form-urlencoded" }),
    );
    expect(response.status).toBe(415);
  });

  it("rejects requests without the CSRF header", async () => {
    const response = await POST(request(payload, { "x-sp-csrf": "" }));
    expect(response.status).toBe(403);
  });

  it("rejects cross-origin requests", async () => {
    const response = await POST(request(payload, { origin: "https://evil.example" }));
    expect(response.status).toBe(403);
  });

  it("rejects requests with no Origin header", async () => {
    const response = await POST(request(payload, { origin: "" }));
    expect(response.status).toBe(403);
  });

  it("returns field errors for invalid input without echoing the input", async () => {
    const response = await POST(request({ ...payload, email: "nope", consent: false }));
    expect(response.status).toBe(422);
    const body = (await response.json()) as { errors: Record<string, string> };
    expect(Object.keys(body.errors)).toEqual(expect.arrayContaining(["email", "consent"]));
    expect(JSON.stringify(body)).not.toContain("nope");
  });

  it("rejects malformed JSON", async () => {
    const response = await POST(request("{not json"));
    expect(response.status).toBe(400);
  });

  it("rejects oversized bodies", async () => {
    const response = await POST(request({ ...payload, message: "x".repeat(20_000) }));
    expect(response.status).toBe(413);
  });

  it("pretends to accept honeypot hits but never forwards them", async () => {
    vi.stubEnv("WEBSITE_DATA_SOURCE", "api");
    resetEnvCache();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(request({ ...payload, website: "http://spam.example" }));
    expect(response.status).toBe(202);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rate limits per client IP", async () => {
    for (let i = 0; i < 3; i += 1) expect((await POST(request(payload))).status).toBe(202);
    const blocked = await POST(request(payload));
    expect(blocked.status).toBe(429);
    expect(Number(blocked.headers.get("retry-after"))).toBeGreaterThan(0);

    // A different client is unaffected.
    const other = await POST(request(payload, { "x-real-ip": "198.51.100.9" }));
    expect(other.status).toBe(202);
  });

  describe("api mode", () => {
    beforeEach(() => {
      vi.stubEnv("WEBSITE_DATA_SOURCE", "api");
      vi.stubEnv("API_INTERNAL_URL", "http://api.internal:8000");
      resetEnvCache();
    });

    it("forwards a snake_case payload to the API and returns its reference", async () => {
      const fetchMock = vi
        .fn()
        .mockResolvedValue(Response.json({ reference: "ENQ-FROMAPI" }, { status: 201 }));
      vi.stubGlobal("fetch", fetchMock);

      const response = await POST(request(payload));
      expect(response.status).toBe(202);
      expect(await response.json()).toEqual({ reference: "ENQ-FROMAPI" });

      const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
      expect(url.toString()).toBe("http://api.internal:8000/api/public/v1/enquiries");
      const sent = JSON.parse(init.body as string) as Record<string, unknown>;
      expect(sent).toMatchObject({
        guardian_name: "Priya Nair",
        grade: "Class VI",
        source: "website",
      });
      expect(sent).not.toHaveProperty("website");
    });

    it("reports a gateway error when the API is unreachable", async () => {
      vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("ECONNREFUSED")));
      const response = await POST(request(payload));
      expect(response.status).toBe(502);
      expect(await response.json()).toEqual({ error: "upstream_unavailable" });
    });

    it("never leaks upstream error details", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(new Response("Traceback: secret stack", { status: 500 })),
      );
      const response = await POST(request(payload));
      expect(response.status).toBe(502);
      expect(await response.text()).not.toContain("Traceback");
    });
  });
});
