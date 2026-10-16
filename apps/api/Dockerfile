# syntax=docker/dockerfile:1
#
# SchoolPlatform API and ARQ worker (same image, different command).
# Build context: apps/api
#   docker build --target runtime -t school-platform/api apps/api
#
# Targets:
#   dev     - all dependency groups; source bind-mounted by docker-compose.override.yml
#   runtime - production: no dev dependencies, non-root, read-only root filesystem friendly

ARG PYTHON_IMAGE=python:3.14.8-slim-trixie
ARG UV_IMAGE=ghcr.io/astral-sh/uv:0.13.1

FROM ${UV_IMAGE} AS uv

# ---------------------------------------------------------------------------
FROM ${PYTHON_IMAGE} AS base
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_PYTHON_DOWNLOADS=never \
    UV_PROJECT_ENVIRONMENT=/opt/venv
# Shared libraries needed at runtime: libmagic (python-magic file-type detection) and
# Pango/HarfBuzz (WeasyPrint PDF rendering). Fonts for Indic scripts are added with the
# report-card phase.
RUN apt-get update \
 && apt-get install -y --no-install-recommends \
        libmagic1t64 libpango-1.0-0 libpangoft2-1.0-0 libharfbuzz-subset0 \
 && rm -rf /var/lib/apt/lists/* \
 && groupadd --system --gid 10001 app \
 && useradd --system --uid 10001 --gid app --home-dir /nonexistent --no-create-home \
            --shell /usr/sbin/nologin app
WORKDIR /app

# ---------------------------------------------------------------------------
FROM base AS builder
COPY --from=uv /uv /usr/local/bin/uv
COPY pyproject.toml uv.lock README.md ./
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-dev --no-install-project
COPY app/ app/
COPY migrations/ migrations/
COPY scripts/ scripts/
COPY alembic.ini ./
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-dev --no-editable

# ---------------------------------------------------------------------------
FROM base AS dev
COPY --from=uv /uv /usr/local/bin/uv
COPY pyproject.toml uv.lock README.md ./
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --all-groups --no-install-project
ENV PATH="/opt/venv/bin:${PATH}"
USER 10001:10001
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

# ---------------------------------------------------------------------------
FROM base AS runtime
# Application code is owned by root and read-only for the runtime user.
COPY --from=builder /opt/venv /opt/venv
COPY --from=builder /app/app /app/app
COPY --from=builder /app/migrations /app/migrations
COPY --from=builder /app/scripts /app/scripts
COPY --from=builder /app/alembic.ini /app/alembic.ini
# Only nginx can reach the API (internal Docker network), so its forwarded headers are trusted.
# Narrow FORWARDED_ALLOW_IPS to the edge network CIDR in production.
# XDG_CACHE_HOME: fontconfig (WeasyPrint) needs a writable cache; /tmp is a tmpfs in compose.
ENV PATH="/opt/venv/bin:${PATH}" \
    FORWARDED_ALLOW_IPS="*" \
    XDG_CACHE_HOME=/tmp/.cache
USER 10001:10001
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD ["python", "-c", "import sys, urllib.request; sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:8000/health/live', timeout=3).status == 200 else 1)"]
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--proxy-headers", "--no-server-header"]
