/**
 * Admissions enquiry proxy: browser -> website -> API.
 *
 * The browser never talks to the API directly for this form. The proxy:
 *   1. requires JSON, the X-SP-CSRF header and a same-origin Origin (CSRF);
 *   2. rate limits per client IP before reading the body (abuse control);
 *   3. caps the body size and validates it with the same schema as the form;
 *   4. silently accepts honeypot hits without forwarding them;
 *   5. forwards valid enquiries to the API (or acknowledges them in mock mode).
 * Responses never echo submitted data, and are never cached.
 */
import { randomBytes } from "node:crypto";

import { type EnquiryResponse, enquirySchema } from "@/lib/enquiry-schema.ts";
import { getEnv, siteOrigin } from "@/lib/env.ts";
import { enquiryLimiter } from "@/lib/rate-limit.ts";
import { clientIp, hasCsrfHeader, isJsonRequest, isSameOrigin } from "@/lib/request-guard.ts";

export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 8 * 1024;
const UPSTREAM_TIMEOUT_MS = 8000;
const BASE_HEADERS = { "Cache-Control": "no-store" };

function reply(status: number, body: Record<string, unknown>, headers?: HeadersInit): Response {
  return Response.json(body, { status, headers: { ...BASE_HEADERS, ...headers } });
}

function newReference(): string {
  return `ENQ-${randomBytes(4).toString("hex").toUpperCase()}`;
}

/** First message per top-level field, safe to show next to the input. */
function fieldErrors(issues: readonly { path: PropertyKey[]; message: string }[]) {
  const errors: Record<string, string> = {};
  for (const issue of issues) {
    const field = String(issue.path[0] ?? "form");
    errors[field] ??= issue.message;
  }
  return errors;
}

async function forwardToApi(
  data: ReturnType<typeof enquirySchema.parse>,
  ip: string,
): Promise<Response> {
  const env = getEnv();
  const upstream = await fetch(new URL("/api/public/v1/enquiries", env.API_INTERNAL_URL), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Forwarded-Host": new URL(env.SITE_URL).host,
      "X-Forwarded-For": ip,
    },
    body: JSON.stringify({
      guardian_name: data.guardianName,
      email: data.email,
      phone: data.phone,
      child_name: data.childName,
      grade: data.grade,
      message: data.message,
      consent: data.consent,
      source: "website",
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
  });

  if (upstream.ok) {
    const payload = (await upstream.json().catch(() => ({}))) as { reference?: unknown };
    const reference = typeof payload.reference === "string" ? payload.reference : newReference();
    return reply(202, { reference } satisfies EnquiryResponse);
  }
  if (upstream.status === 429) {
    return reply(429, { error: "rate_limited" }, { "Retry-After": "600" });
  }
  if (upstream.status === 422) return reply(422, { error: "invalid", errors: {} });
  return reply(502, { error: "upstream_unavailable" });
}

export async function POST(request: Request): Promise<Response> {
  const { headers } = request;
  if (!isJsonRequest(headers)) return reply(415, { error: "unsupported_media_type" });
  if (!hasCsrfHeader(headers) || !isSameOrigin(headers, siteOrigin())) {
    return reply(403, { error: "forbidden" });
  }

  const ip = clientIp(headers);
  const limit = enquiryLimiter().check(ip);
  if (!limit.allowed) {
    return reply(
      429,
      { error: "rate_limited" },
      { "Retry-After": String(limit.retryAfterSeconds) },
    );
  }

  if (Number(headers.get("content-length") ?? "0") > MAX_BODY_BYTES) {
    return reply(413, { error: "payload_too_large" });
  }
  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) return reply(413, { error: "payload_too_large" });

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return reply(400, { error: "invalid_json" });
  }

  const result = enquirySchema.safeParse(parsed);
  if (!result.success) {
    return reply(422, { error: "invalid", errors: fieldErrors(result.error.issues) });
  }

  if (result.data.website !== "") {
    // A person cannot see the honeypot field. Pretend success so the bot learns nothing.
    console.warn(JSON.stringify({ event: "enquiry.honeypot", ip }));
    return reply(202, { reference: newReference() } satisfies EnquiryResponse);
  }

  if (getEnv().WEBSITE_DATA_SOURCE === "mock") {
    // The API's admissions module does not exist yet: acknowledge without storing anything.
    const reference = newReference();
    console.info(JSON.stringify({ event: "enquiry.accepted", mode: "mock", reference }));
    return reply(202, { reference } satisfies EnquiryResponse);
  }

  try {
    return await forwardToApi(result.data, ip);
  } catch {
    return reply(502, { error: "upstream_unavailable" });
  }
}
