/**
 * On-demand revalidation webhook, called by the API when CMS content is published.
 *
 *   POST /api/revalidate
 *   X-SP-Timestamp: <unix seconds>
 *   X-SP-Signature: sha256=<hex HMAC-SHA256 of "<timestamp>.<raw body>" with REVALIDATE_SECRET>
 *   { "tags": ["cms:notices"], "paths": ["/notices"] }
 *
 * Fails closed: without REVALIDATE_SECRET every request is refused. The signature check is
 * constant-time and bound to a fresh timestamp (lib/signature.ts), and tags/paths are matched
 * against strict patterns so a caller can only purge content caches.
 */
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";

import { getEnv } from "@/lib/env.ts";
import { verifySignature } from "@/lib/signature.ts";

export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 10_000;
const NO_STORE = { "Cache-Control": "no-store" };

const bodySchema = z
  .object({
    tags: z
      .array(z.string().regex(/^cms(?::[a-z0-9-]{1,80}){0,2}$/))
      .max(20)
      .default([]),
    paths: z
      .array(z.string().regex(/^\/(?:[a-z0-9][a-z0-9/_-]{0,198})?$/))
      .max(20)
      .default([]),
  })
  .refine((body) => body.tags.length + body.paths.length > 0, "Nothing to revalidate");

function reply(status: number, body: Record<string, unknown>): Response {
  return Response.json(body, { status, headers: NO_STORE });
}

export async function POST(request: Request): Promise<Response> {
  const { REVALIDATE_SECRET: secret } = getEnv();
  if (!secret) return reply(503, { error: "revalidation_disabled" });

  const declared = Number(request.headers.get("content-length") ?? "0");
  if (declared > MAX_BODY_BYTES) return reply(413, { error: "payload_too_large" });
  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) return reply(413, { error: "payload_too_large" });

  const verdict = verifySignature({
    secret,
    timestamp: request.headers.get("x-sp-timestamp"),
    signature: request.headers.get("x-sp-signature"),
    body: raw,
  });
  // One response for every failure reason, so a caller learns nothing about which check failed.
  if (!verdict.ok) return reply(401, { error: "invalid_signature" });

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return reply(400, { error: "invalid_json" });
  }
  const body = bodySchema.safeParse(parsed);
  if (!body.success) return reply(400, { error: "invalid_body" });

  for (const tag of body.data.tags) revalidateTag(tag, { expire: 0 });
  for (const path of body.data.paths) revalidatePath(path);

  return reply(200, {
    revalidated: { tags: body.data.tags, paths: body.data.paths },
    at: new Date().toISOString(),
  });
}
