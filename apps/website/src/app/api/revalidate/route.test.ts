import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const revalidateTag = vi.fn();
const revalidatePath = vi.fn();
vi.mock("next/cache", () => ({ revalidateTag, revalidatePath }));

const { POST } = await import("@/app/api/revalidate/route.ts");
const { resetEnvCache } = await import("@/lib/env.ts");
const { signPayload } = await import("@/lib/signature.ts");

const SECRET = "k".repeat(48);

function signed(body: unknown, overrides: { timestamp?: string; secret?: string } = {}): Request {
  const raw = JSON.stringify(body);
  const timestamp = overrides.timestamp ?? String(Math.floor(Date.now() / 1000));
  return new Request("http://localhost:3000/api/revalidate", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-sp-timestamp": timestamp,
      "x-sp-signature": signPayload(overrides.secret ?? SECRET, timestamp, raw),
    },
    body: raw,
  });
}

beforeEach(() => {
  vi.stubEnv("REVALIDATE_SECRET", SECRET);
  resetEnvCache();
  revalidateTag.mockClear();
  revalidatePath.mockClear();
});

afterEach(() => {
  vi.unstubAllEnvs();
  resetEnvCache();
});

describe("POST /api/revalidate", () => {
  it("refuses everything while no secret is configured", async () => {
    vi.stubEnv("REVALIDATE_SECRET", "");
    resetEnvCache();
    const response = await POST(signed({ tags: ["cms"] }));
    expect(response.status).toBe(503);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("purges tags and paths for a correctly signed request", async () => {
    const response = await POST(
      signed({ tags: ["cms:notices", "cms:notice:diwali"], paths: ["/notices"] }),
    );
    expect(response.status).toBe(200);
    expect(revalidateTag).toHaveBeenCalledWith("cms:notices", { expire: 0 });
    expect(revalidateTag).toHaveBeenCalledWith("cms:notice:diwali", { expire: 0 });
    expect(revalidatePath).toHaveBeenCalledWith("/notices");
  });

  it("rejects a signature made with the wrong secret", async () => {
    const response = await POST(signed({ tags: ["cms"] }, { secret: "z".repeat(48) }));
    expect(response.status).toBe(401);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("rejects a stale timestamp (replay)", async () => {
    const old = String(Math.floor(Date.now() / 1000) - 3600);
    const response = await POST(signed({ tags: ["cms"] }, { timestamp: old }));
    expect(response.status).toBe(401);
  });

  it("rejects unsigned requests with the same response as bad signatures", async () => {
    const unsigned = new Request("http://localhost:3000/api/revalidate", {
      method: "POST",
      body: JSON.stringify({ tags: ["cms"] }),
    });
    const a = await POST(unsigned);
    const b = await POST(signed({ tags: ["cms"] }, { secret: "z".repeat(48) }));
    expect(a.status).toBe(401);
    expect(await a.json()).toEqual(await b.json());
  });

  it.each([
    ["a tag outside the cms namespace", { tags: ["users"] }],
    ["a malformed tag", { tags: ["cms:UPPER"] }],
    ["a path traversal", { paths: ["/../etc"] }],
    ["an absolute URL as a path", { paths: ["https://evil.example"] }],
    ["an empty request", {}],
    ["too many tags", { tags: Array.from({ length: 21 }, (_, i) => `cms:t${i}`) }],
  ])("rejects %s even when signed", async (_name, body) => {
    const response = await POST(signed(body));
    expect(response.status).toBe(400);
    expect(revalidateTag).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
