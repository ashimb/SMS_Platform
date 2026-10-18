/** Liveness probe for the container HEALTHCHECK (infra/docker/website.Dockerfile). */
export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({ status: "ok" }, { headers: { "Cache-Control": "no-store" } });
}
