#!/usr/bin/env bash

# Database backup script for MCP Registry
# Creates a pg_dump backup and commits it to git
# Backs up all schemas: registry, metrics

set -e

# Configuration
POSTGRES_VERSION=18
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=finances_manager_admin
POSTGRES_DB=mcp_registry

# Detect machine and set Postgres location
CURRENT_MACHINE=$(hostname -s)
if [[ ${CURRENT_MACHINE} == 'MacStudio' ]]; then
  POSTGRES_LOCATION=/Volumes/NVMe/MacOS/Apps
elif [[ -d "/Applications/Postgres.app" ]]; then
  POSTGRES_LOCATION=/Applications
else
  POSTGRES_LOCATION=/Volumes/Media/MacOS/Apps
fi

PG_DUMP="${POSTGRES_LOCATION}/Postgres.app/Contents/Versions/${POSTGRES_VERSION}/bin/pg_dump"

# Get project root directory (script is in scripts/db/)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "${SCRIPT_DIR}")")"
BACKUP_DIR="${PROJECT_ROOT}/scripts/database-backups"

# Generate timestamp
CURRENT_TIME=$(date "+%Y.%m.%d-%H:%M")

# Ensure backup directory exists
mkdir -p "${BACKUP_DIR}"

# Remove existing backup files
cd "${BACKUP_DIR}" || exit 1
rm -f *.tar 2>/dev/null || true
echo "Existing database dump deleted"

# Create new backup (includes all schemas: registry, metrics)
"${PG_DUMP}" \
  --host="${POSTGRES_HOST}" \
  --port="${POSTGRES_PORT}" \
  --username="${POSTGRES_USER}" \
  --format=tar \
  --inserts \
  --dbname="${POSTGRES_DB}" \
  --file="${BACKUP_DIR}/mcp_registry-${CURRENT_TIME}-dump.tar"

echo "Database dump for '${CURRENT_TIME}' successfully generated"

# Commit the backup
cd "${PROJECT_ROOT}" || exit 1
git add scripts/database-backups/
git commit -q -m "[dump] Database dump - ${CURRENT_TIME}"
echo "Database dump committed to git"

exit 0
