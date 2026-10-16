# syntax=docker/dockerfile:1
#
# Public website (Next.js) image.
# Build context: repository root.
#   docker build -f infra/docker/website.Dockerfile --target runtime -t school-platform/website .
#
# Expects (created in the website phase): apps/website/package.json with "dev" and "build"
# scripts, next.config with `output: "standalone"`, and a GET /api/healthz route.
#
# Targets:
#   dev     - `next dev` on :3000 (source bind-mounted by docker-compose.override.yml)
#   runtime - Next.js standalone server (only traced production dependencies), non-root

ARG NODE_IMAGE=node:24.22.0-alpine3.24

# ---------------------------------------------------------------------------
FROM ${NODE_IMAGE} AS deps
WORKDIR /repo
ENV CI=true NPM_CONFIG_UPDATE_NOTIFIER=false NPM_CONFIG_FUND=false NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json ./
COPY packages/ packages/
COPY apps/website/package.json apps/website/
RUN --mount=type=cache,target=/root/.npm \
    npm ci --workspace=apps/website --include-workspace-root=false

# ---------------------------------------------------------------------------
FROM deps AS dev
COPY apps/website/ apps/website/
RUN chown -R node:node /repo
USER node
EXPOSE 3000
CMD ["npm", "run", "dev", "-w", "apps/website", "--", "--hostname", "0.0.0.0", "--port", "3000"]

# ---------------------------------------------------------------------------
FROM deps AS build
COPY apps/website/ apps/website/
RUN npm run build -w apps/website

# ---------------------------------------------------------------------------
FROM ${NODE_IMAGE} AS runtime
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000
RUN addgroup -S -g 10001 app && adduser -S -u 10001 -G app -H -s /sbin/nologin app
WORKDIR /srv
# The standalone output mirrors the monorepo layout: server.js lives under apps/website/.
COPY --from=build /repo/apps/website/.next/standalone ./
COPY --from=build /repo/apps/website/.next/static ./apps/website/.next/static
COPY --from=build /repo/apps/website/public ./apps/website/public
USER 10001:10001
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD ["node", "-e", "fetch('http://127.0.0.1:3000/api/healthz').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"]
CMD ["node", "apps/website/server.js"]
