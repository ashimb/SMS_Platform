#!/usr/bin/env bash
# Generates a self-signed TLS certificate for local development only.
# Covers localhost, portal.localhost and www.localhost. Output: infra/nginx/certs/{fullchain,privkey}.pem
# (git-ignored). Set FORCE=1 to regenerate. For browser-trusted dev certificates, use mkcert instead
# and write the files to the same paths.

set -Eeuo pipefail

cert_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/../nginx/certs" && pwd)"
cert="${cert_dir}/fullchain.pem"
key="${cert_dir}/privkey.pem"

if [[ -f "$cert" && -f "$key" && "${FORCE:-0}" != "1" ]]; then
  echo "dev certificates already exist in ${cert_dir} (FORCE=1 to regenerate)"
  exit 0
fi

command -v openssl >/dev/null 2>&1 || { echo "openssl is required" >&2; exit 1; }

# MSYS_NO_PATHCONV stops Git Bash on Windows from rewriting the "/CN=..." subject as a path.
MSYS_NO_PATHCONV=1 openssl req -x509 -nodes -days 397 \
  -newkey ec -pkeyopt ec_paramgen_curve:prime256v1 \
  -keyout "$key" -out "$cert" \
  -subj "/CN=localhost" \
  -addext "subjectAltName=DNS:localhost,DNS:portal.localhost,DNS:www.localhost,IP:127.0.0.1" \
  -addext "extendedKeyUsage=serverAuth" 2>/dev/null

# The nginx container runs as an unprivileged user and must be able to read the dev key.
# Dev-only: production keys are mounted from the secrets manager with strict permissions.
chmod 644 "$cert" "$key"
echo "wrote ${cert} and ${key}"
