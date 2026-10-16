#!/usr/bin/env bash
# Logical MySQL backup: consistent mysqldump -> gzip -> SHA-256 checksum, with retention pruning.
#
# Usage (via the ops container, see `make backup`):
#   docker compose --profile ops run --rm backup /scripts/backup_mysql.sh
#
# Environment:
#   MYSQL_HOST (default 127.0.0.1), MYSQL_PORT (3306), MYSQL_USER (root),
#   MYSQL_PASSWORD (required), DB_NAME (required),
#   BACKUP_DIR (./backups), BACKUP_RETENTION_DAYS (14; 0 disables pruning)
#
# Notes:
#   - The password is passed through a temporary option file (mode 600), never on the command line.
#   - --single-transaction gives a consistent InnoDB snapshot without locking tables.
#   - The dump has no CREATE DATABASE/USE statements, so it can be restored into any database
#     name (restore_check.sh relies on this).
#   - This is the logical layer. Point-in-time recovery (RPO <= 15 min, FRD FR-SEC-038) also needs
#     binlog shipping or managed-database PITR in production.

set -Eeuo pipefail
umask 077

MYSQL_HOST="${MYSQL_HOST:-127.0.0.1}"
MYSQL_PORT="${MYSQL_PORT:-3306}"
MYSQL_USER="${MYSQL_USER:-root}"
: "${MYSQL_PASSWORD:?MYSQL_PASSWORD is required}"
: "${DB_NAME:?DB_NAME is required}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"

log() { printf '%s [backup] %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$*" >&2; }
die() { log "ERROR: $*"; exit 1; }

for bin in mysqldump gzip sha256sum; do
  command -v "$bin" >/dev/null 2>&1 || die "required command not found: $bin"
done
[[ "$DB_NAME" =~ ^[A-Za-z0-9_]+$ ]] || die "DB_NAME contains unsupported characters"
[[ "$BACKUP_RETENTION_DAYS" =~ ^[0-9]+$ ]] || die "BACKUP_RETENTION_DAYS must be a non-negative integer"

mkdir -p "$BACKUP_DIR"

defaults_file="$(mktemp)"
tmp_dump=""
cleanup() {
  rm -f "$defaults_file"
  [[ -n "$tmp_dump" ]] && rm -f "$tmp_dump"
  return 0
}
trap cleanup EXIT

escaped_password="${MYSQL_PASSWORD//\\/\\\\}"
escaped_password="${escaped_password//\"/\\\"}"
printf '[client]\nhost=%s\nport=%s\nuser=%s\npassword="%s"\n' \
  "$MYSQL_HOST" "$MYSQL_PORT" "$MYSQL_USER" "$escaped_password" > "$defaults_file"

timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
final_file="${BACKUP_DIR%/}/${DB_NAME}_${timestamp}.sql.gz"
tmp_dump="${final_file}.partial"

log "dumping database '${DB_NAME}' from ${MYSQL_HOST}:${MYSQL_PORT}"
start=$(date +%s)

mysqldump --defaults-extra-file="$defaults_file" \
  --single-transaction \
  --quick \
  --routines \
  --triggers \
  --events \
  --hex-blob \
  --no-tablespaces \
  --set-gtid-purged=OFF \
  --default-character-set=utf8mb4 \
  "$DB_NAME" | gzip -6 > "$tmp_dump"

gzip -t "$tmp_dump" || die "compressed dump failed integrity test"
mv "$tmp_dump" "$final_file"
tmp_dump=""

(cd "$(dirname "$final_file")" && sha256sum "$(basename "$final_file")" > "$(basename "$final_file").sha256")

elapsed=$(( $(date +%s) - start ))
size=$(wc -c < "$final_file" | tr -d ' ')
log "wrote ${final_file} (${size} bytes) in ${elapsed}s"

if (( BACKUP_RETENTION_DAYS > 0 )); then
  pruned=$(find "$BACKUP_DIR" -maxdepth 1 -type f \
    \( -name "${DB_NAME}_*.sql.gz" -o -name "${DB_NAME}_*.sql.gz.sha256" \) \
    -mtime +"$BACKUP_RETENTION_DAYS" -print -delete | wc -l | tr -d ' ')
  log "pruned ${pruned} file(s) older than ${BACKUP_RETENTION_DAYS} days"
fi

printf '%s\n' "$final_file"
