import { describe, expect, it } from "vitest";

import { signPayload, verifySignature } from "@/lib/signature.ts";

const SECRET = "s".repeat(40);
const BODY = JSON.stringify({ tags: ["cms:notices"] });
const NOW = 1_800_000_000;

function sign(timestamp = String(NOW), body = BODY, secret = SECRET) {
  return signPayload(secret, timestamp, body);
}

describe("verifySignature", () => {
  it("accepts a correct, fresh signature", () => {
    const result = verifySignature({
      secret: SECRET,
      timestamp: String(NOW),
      signature: sign(),
      body: BODY,
      now: NOW + 10,
    });
    expect(result).toEqual({ ok: true });
  });

  it("rejects a signature made with another secret", () => {
    const result = verifySignature({
      secret: SECRET,
      timestamp: String(NOW),
      signature: sign(String(NOW), BODY, "x".repeat(40)),
      body: BODY,
      now: NOW,
    });
    expect(result).toEqual({ ok: false, reason: "mismatch" });
  });

  it("rejects a tampered body", () => {
    const result = verifySignature({
      secret: SECRET,
      timestamp: String(NOW),
      signature: sign(),
      body: JSON.stringify({ tags: ["cms"] }),
      now: NOW,
    });
    expect(result).toEqual({ ok: false, reason: "mismatch" });
  });

  it("rejects a replayed request outside the tolerance window", () => {
    const result = verifySignature({
      secret: SECRET,
      timestamp: String(NOW),
      signature: sign(),
      body: BODY,
      now: NOW + 301,
    });
    expect(result).toEqual({ ok: false, reason: "stale" });
  });

  it("rejects a timestamp swapped after signing", () => {
    const result = verifySignature({
      secret: SECRET,
      timestamp: String(NOW + 5),
      signature: sign(),
      body: BODY,
      now: NOW + 5,
    });
    expect(result).toEqual({ ok: false, reason: "mismatch" });
  });

  it.each([
    ["missing signature", null, String(NOW)],
    ["missing timestamp", "sha256=" + "a".repeat(64), null],
    ["wrong prefix", "md5=" + "a".repeat(64), String(NOW)],
    ["short digest", "sha256=abc", String(NOW)],
    ["non-hex digest", "sha256=" + "z".repeat(64), String(NOW)],
    ["non-numeric timestamp", "sha256=" + "a".repeat(64), "yesterday"],
  ])("rejects malformed input: %s", (_name, signature, timestamp) => {
    const result = verifySignature({ secret: SECRET, timestamp, signature, body: BODY, now: NOW });
    expect(result).toEqual({ ok: false, reason: "format" });
  });
});
