#!/bin/bash
set -e

# ============================================================
# backup.sh — ежедневный дамп базы данных PostgreSQL
# Использование: sudo ./scripts/backup.sh
# Результат: backups/backup_YYYY-MM-DD_HHmm.sql.gz
# Хранит последние 14 копий, старые удаляет автоматически.
# ============================================================

BACKUP_DIR="$(cd "$(dirname "$0")/.." && pwd)/backups"
DB_USER="${POSTGRES_USER:-postgres}"
DB_NAME="${POSTGRES_DB:-utm_builder}"
RETENTION_COUNT=14

mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +%F_%H%M)
FILENAME="backup_${TIMESTAMP}.sql.gz"
FILEPATH="${BACKUP_DIR}/${FILENAME}"

echo "[$(date '+%F %T')] Starting backup: ${FILENAME}"

docker compose exec -T db pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$FILEPATH"

# Проверяем, что файл не пустой
if [ ! -s "$FILEPATH" ]; then
  echo "[$(date '+%F %T')] ERROR: Backup file is empty!"
  rm -f "$FILEPATH"
  exit 1
fi

echo "[$(date '+%F %T')] Backup saved: ${FILEPATH} ($(du -h "$FILEPATH" | cut -f1))"

# Удаляем старые копии, оставляя только последние RETENTION_COUNT
cd "$BACKUP_DIR"
ls -1t backup_*.sql.gz 2>/dev/null | tail -n +$((RETENTION_COUNT + 1)) | while read -r old; do
  rm -f "$BACKUP_DIR/$old"
  echo "[$(date '+%F %T')] Removed old backup: ${old}"
done

echo "[$(date '+%F %T')] Backup complete. ${RETENTION_COUNT} most recent copies retained."
