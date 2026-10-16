#!/usr/bin/env bash
# Restore verification: restores a backup into a throw-away scratch database, runs sanity checks,
# then drops the scratch database. Exits non-zero if any check fails.
#
# Usage (via the ops container, see `make restore-check`):
#   docker compose --profile ops run --rm backup /scripts/restore_check.sh [backup-file]
# Without an argument, the newest ${DB_NAME}_*.sql.gz in BACKUP_DIR is used.
#
# Environment: as backup_mysql.sh, plus
#   ALLOW_EMPTY_BACKUP=1   accept a dump with zero tables (fresh install before migrations)
#
# The connecting user needs CREATE and DROP on databases (root or a dedicated restore user).

set -Eeuo pipefail
umask 077

MYSQL_HOST="${MYSQL_HOST:-127.0.0.1}"
MYSQL_PORT="${MYSQL_PORT:-3306}"
MYSQL_USER="${MYSQL_USER:-root}"
: "${MYSQL_PASSWORD:?MYSQL_PASSWORD is required}"
: "${DB_NAME:?DB_NAME is required}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
ALLOW_EMPTY_BACKUP="${ALLOW_EMPTY_BACKUP:-0}"

log() { printf '%s [restore-check] %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$*" >&2; }
die() { log "FAIL: $*"; exit 1; }

for bin in mysql mysqlcheck gzip sha256sum; do
  command -v "$bin" >/dev/null 2>&1 || die "required command not found: $bin"
done

backup_file="${1:-}"
if [[ -z "$backup_file" ]]; then
  backup_file="$(ls -1t "${BACKUP_DIR%/}/${DB_NAME}"_*.sql.gz 2>/dev/null | head -n 1 || true)"
fi
[[ -n "$backup_file" && -f "$backup_file" ]] || die "no backup file found (looked in ${BACKUP_DIR})"
log "verifying ${backup_file}"

# 1. Checksum and compression integrity
if [[ -f "${backup_file}.sha256" ]]; then
  (cd "$(dirname "$backup_file")" && sha256sum -c --status "$(basename "$backup_file").sha256") \
    || die "checksum mismatch"
  log "checksum OK"
else
  die "checksum file missing: ${backup_file}.sha256"
fi
gzip -t "$backup_file" || die "gzip integrity test failed"
log "compression integrity OK"

defaults_file="$(mktemp)"
scratch_db="restore_check_$(date -u +%Y%m%d%H%M%S)_$$"
escaped_password="${MYSQL_PASSWORD//\\/\\\\}"
escaped_password="${escaped_password//\"/\\\"}"
printf '[client]\nhost=%s\nport=%s\nuser=%s\npassword="%s"\n' \
  "$MYSQL_HOST" "$MYSQL_PORT" "$MYSQL_USER" "$escaped_password" > "$defaults_file"

sql() { mysql --defaults-extra-file="$defaults_file" --batch --skip-column-names "$@"; }

cleanup() {
  sql -e "DROP DATABASE IF EXISTS \`${scratch_db}\`" >/dev/null 2>&1 || log "warning: could not drop ${scratch_db}"
  rm -f "$defaults_file"
}
trap cleanup EXIT

# 2. Restore into the scratch database
start=$(date +%s)
sql -e "CREATE DATABASE \`${scratch_db}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci"
gzip -dc "$backup_file" | sql --database="$scratch_db" || die "restore failed"
elapsed=$(( $(date +%s) - start ))
log "restored into ${scratch_db} in ${elapsed}s"

# 3. Sanity checks
table_count="$(sql -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '${scratch_db}'")"
log "tables restored: ${table_count}"
if (( table_count == 0 )); then
  [[ "$ALLOW_EMPTY_BACKUP" == "1" ]] || die "backup contains no tables (set ALLOW_EMPTY_BACKUP=1 for a fresh install)"
  log "empty backup accepted (ALLOW_EMPTY_BACKUP=1)"
else
  mysqlcheck --defaults-extra-file="$defaults_file" --check --silent "$scratch_db" \
    || die "mysqlcheck reported problems"
  log "mysqlcheck OK"

  has_table() {
    [[ "$(sql -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '${scratch_db}' AND table_name = '$1'")" == "1" ]]
  }

  if has_table alembic_version; then
    version="$(sql --database="$scratch_db" -e "SELECT version_num FROM alembic_version LIMIT 1")"
    [[ -n "$version" ]] || die "alembic_version is empty"
    log "alembic revision: ${version}"
  fi

  if has_table tenants; then
    tenants="$(sql --database="$scratch_db" -e "SELECT COUNT(*) FROM tenants")"
    (( tenants >= 1 )) || die "no tenant rows restored (the default tenant must exist)"
    log "tenant rows: ${tenants}"
  fi

  # The restored table set should match the live database (warning only: the schema may have
  # changed since the backup was taken).
  live_tables="$(sql -e "SELECT table_name FROM information_schema.tables WHERE table_schema = '${DB_NAME}' ORDER BY table_name" || true)"
  restored_tables="$(sql -e "SELECT table_name FROM information_schema.tables WHERE table_schema = '${scratch_db}' ORDER BY table_name")"
  if [[ "$live_tables" != "$restored_tables" ]]; then
    log "warning: restored table set differs from live database '${DB_NAME}'"
  fi
fi

log "PASS: ${backup_file} restored and verified in ${elapsed}s"
