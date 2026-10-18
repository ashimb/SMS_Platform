/**
 * Validated runtime configuration for the website.
 *
 * Parsed lazily (first use, not at import) so `next build` works without secrets, and cached for
 * the process. Empty strings count as unset, so a blank `KEY=` line in .env behaves like no line.
 */
import { z } from "zod";

const schema = z.object({
  SITE_URL: z.url().default("http://localhost:3000"),
  /** "mock": typed fixtures; "api": read the public CMS endpoints of the API. */
  WEBSITE_DATA_SOURCE: z.enum(["mock", "api"]).default("mock"),
  API_INTERNAL_URL: z.url().default("http://127.0.0.1:8000"),
  /** Signed revalidation webhook secret. Unset: the endpoint refuses every request. */
  REVALIDATE_SECRET: z.string().min(32).optional(),
  ENQUIRY_RATE_LIMIT: z.coerce.number().int().min(1).max(10_000).default(5),
  ENQUIRY_RATE_WINDOW_SECONDS: z.coerce.number().int().min(10).max(86_400).default(600),
});

export type Env = z.infer<typeof schema>;

type RawEnv = Readonly<Record<string, string | undefined>>;

export function parseEnv(raw: RawEnv): Env {
  const input = Object.fromEntries(
    Object.keys(schema.shape).map((key) => [key, raw[key] === "" ? undefined : raw[key]]),
  );
  return schema.parse(input);
}

let cached: Env | undefined;

export function getEnv(): Env {
  cached ??= parseEnv(process.env);
  return cached;
}

/** Canonical public origin without a trailing slash. */
export function siteOrigin(env: Env = getEnv()): string {
  return new URL(env.SITE_URL).origin;
}

/** Test helper: drop the cached configuration. */
export function resetEnvCache(): void {
  cached = undefined;
}
