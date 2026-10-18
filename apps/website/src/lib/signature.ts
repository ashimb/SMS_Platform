/**
 * HMAC verification for the revalidation webhook.
 *
 * The sender signs `${timestamp}.${rawBody}` with HMAC-SHA256 and sends
 *   X-SP-Timestamp: <unix seconds>
 *   X-SP-Signature: sha256=<hex>
 * The timestamp is part of the signed message and must be recent, so a captured request cannot be
 * replayed later. The comparison is constant time.
 */
import { createHmac, timingSafeEqual } from "node:crypto";

export const SIGNATURE_TOLERANCE_SECONDS = 300;

export function signPayload(secret: string, timestamp: string, body: string): string {
  const digest = createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");
  return `sha256=${digest}`;
}

export type SignatureResult = { ok: true } | { ok: false; reason: "format" | "stale" | "mismatch" };

export interface VerifyInput {
  secret: string;
  timestamp: string | null;
  signature: string | null;
  body: string;
  /** Unix seconds; injectable for tests. */
  now?: number;
  toleranceSeconds?: number;
}

const SIGNATURE_PATTERN = /^sha256=([0-9a-f]{64})$/;

export function verifySignature(input: VerifyInput): SignatureResult {
  const { secret, timestamp, signature, body } = input;
  const match = signature === null ? null : SIGNATURE_PATTERN.exec(signature);
  if (!match?.[1] || timestamp === null || !/^\d{1,12}$/.test(timestamp)) {
    return { ok: false, reason: "format" };
  }

  const now = input.now ?? Math.floor(Date.now() / 1000);
  const tolerance = input.toleranceSeconds ?? SIGNATURE_TOLERANCE_SECONDS;
  if (Math.abs(now - Number(timestamp)) > tolerance) return { ok: false, reason: "stale" };

  const expected = Buffer.from(signPayload(secret, timestamp, body).slice("sha256=".length), "hex");
  const received = Buffer.from(match[1], "hex");
  // Both are 32 bytes (the pattern guarantees 64 hex characters), as timingSafeEqual requires.
  return timingSafeEqual(expected, received) ? { ok: true } : { ok: false, reason: "mismatch" };
}
