# syntax=docker/dockerfile:1
#
# Portal (Vite + React SPA) image.
# Build context: repository root.
#   docker build -f infra/docker/portal.Dockerfile --target runtime -t school-platform/portal .
#
# apps/portal (Phase 4): "dev" and "build" scripts, Vite output in apps/portal/dist. Workspace
# packages are compiled from source (the "source" export condition), so no package build step.
#
# Targets:
#   dev     - Vite dev server on :8080 (source bind-mounted by docker-compose.override.yml)
#   runtime - static files served by unprivileged nginx on :8080; no Node.js in the final image

ARG NODE_IMAGE=node:24.22.0-alpine3.24
ARG NGINX_IMAGE=nginxinc/nginx-unprivileged:1.30.6-alpine3.24

# ---------------------------------------------------------------------------
FROM ${NODE_IMAGE} AS deps
WORKDIR /repo
ENV CI=true NPM_CONFIG_UPDATE_NOTIFIER=false NPM_CONFIG_FUND=false
COPY package.json package-lock.json ./
COPY packages/ packages/
COPY apps/portal/package.json apps/portal/
RUN --mount=type=cache,target=/root/.npm \
    npm ci --workspace=apps/portal --include-workspace-root=false

# ---------------------------------------------------------------------------
FROM deps AS dev
COPY apps/portal/ apps/portal/
RUN chown -R node:node /repo
USER node
EXPOSE 8080
CMD ["npm", "run", "dev", "-w", "apps/portal", "--", "--host", "0.0.0.0", "--port", "8080"]

# ---------------------------------------------------------------------------
FROM deps AS build
COPY apps/portal/ apps/portal/
RUN npm run build -w apps/portal

# ---------------------------------------------------------------------------
FROM ${NGINX_IMAGE} AS runtime
# SPA server: hashed assets cached for a year; index.html and the service worker never cached.
COPY <<'EOF' /etc/nginx/conf.d/default.conf
server {
    listen 8080;
    server_name _;
    root /usr/share/nginx/html;
    server_tokens off;

    # Compress here too, so the image is fast on its own (the edge proxy passes it through).
    gzip on;
    gzip_vary on;
    gzip_comp_level 6;
    gzip_min_length 1024;
    gzip_types text/css application/javascript application/json application/manifest+json image/svg+xml;

    location = /healthz {
        access_log off;
        default_type text/plain;
        return 200 "ok\n";
    }

    location /assets/ {
        add_header Cache-Control "public, max-age=31536000, immutable";
        try_files $uri =404;
    }

    location ~ ^/(sw\.js|manifest\.webmanifest)$ {
        add_header Cache-Control "no-cache";
        try_files $uri =404;
    }

    # HTML: strict CSP with a fresh nonce per response ($request_id: 128 random bits). The nonce
    # is substituted into index.html's <meta name="csp-nonce">; see apps/portal/config/csp.ts
    # (kept in sync by apps/portal/config/config.test.ts).
    location / {
        sub_filter_once off;
        sub_filter '__CSP_NONCE__' $request_id;
        add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'nonce-$request_id'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; manifest-src 'self'; worker-src 'self'; frame-src 'none'; frame-ancestors 'none'; form-action 'self'; base-uri 'none'; object-src 'none'; upgrade-insecure-requests" always;
        add_header Cache-Control "no-cache" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;
        try_files $uri /index.html;
    }
}
EOF
COPY --from=build /repo/apps/portal/dist /usr/share/nginx/html
USER 101
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1
