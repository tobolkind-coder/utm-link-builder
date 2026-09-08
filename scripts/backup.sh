#!/bin/bash
set -euo pipefail

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

# Целостность архива. Одной проверки на непустоту мало: gzip от пустого ввода
# даёт валидный файл около 20 байт, поэтому дополнительно смотрим, что внутри
# действительно есть дамп. Основную защиту даёт pipefail — он не даёт ошибке
# pg_dump потеряться за успешным статусом gzip.
if ! gzip -t "$FILEPATH" 2>/dev/null; then
  echo "[$(date '+%F %T')] ERROR: Backup archive is corrupt!"
  rm -f "$FILEPATH"
  exit 1
fi

if [ "$(gzip -dc "$FILEPATH" | wc -c)" -lt 100 ]; then
  echo "[$(date '+%F %T')] ERROR: Backup contains no data!"
  rm -f "$FILEPATH"
  exit 1
fi

echo "[$(date '+%F %T')] Backup saved: ${FILEPATH} ($(du -h "$FILEPATH" | cut -f1))"

# Удаляем старые копии, оставляя только последние RETENTION_COUNT
cd "$BACKUP_DIR"
# || true обязателен: без совпадений ls возвращает ненулевой код, и под
# pipefail вместе с errexit скрипт падал бы при первом запуске, когда старых
# копий ещё нет.
ls -1t backup_*.sql.gz 2>/dev/null | tail -n +$((RETENTION_COUNT + 1)) | while read -r old; do
  rm -f "$BACKUP_DIR/$old"
  echo "[$(date '+%F %T')] Removed old backup: ${old}"
done || true

echo "[$(date '+%F %T')] Backup complete. ${RETENTION_COUNT} most recent copies retained."
