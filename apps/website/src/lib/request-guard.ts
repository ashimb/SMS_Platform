/**
 * Request checks shared by the public form proxy.
 *
 * CSRF: the enquiry endpoint takes no cookies or ambient credentials. It still requires (1) a
 * JSON content type and (2) the custom X-SP-CSRF header, which a cross-site form or `fetch`
 * cannot send without a CORS preflight that this server never approves, plus (3) a matching
 * Origin. Any one of these stops a cross-site POST; together they are defence in depth.
 */
export const CSRF_HEADER = "x-sp-csrf";

/** Client address as seen by the edge proxy (nginx sets X-Real-IP from the socket, never the client). */
export function clientIp(headers: Headers): string {
  const real = headers.get("x-real-ip")?.trim();
  if (real) return real;
  const forwarded = headers.get("x-forwarded-for");
  const last = forwarded?.split(",").at(-1)?.trim();
  return last && last.length > 0 ? last : "unknown";
}

export function hasCsrfHeader(headers: Headers): boolean {
  return headers.get(CSRF_HEADER) === "1";
}

export function isJsonRequest(headers: Headers): boolean {
  return (headers.get("content-type") ?? "").toLowerCase().startsWith("application/json");
}

/** The Origin header must be present and name this site (browser form posts always send it). */
export function isSameOrigin(headers: Headers, siteOrigin: string): boolean {
  const origin = headers.get("origin");
  if (!origin) return false;
  const fetchSite = headers.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin") return false;

  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    return false;
  }
  const allowed = new Set<string>([new URL(siteOrigin).host]);
  for (const name of ["host", "x-forwarded-host"]) {
    const value = headers.get(name)?.split(",")[0]?.trim();
    if (value) allowed.add(value);
  }
  return allowed.has(originHost);
}
