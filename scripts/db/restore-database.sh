#!/usr/bin/env bash

# Database restore script for MCP Registry
# Restores a pg_dump backup created by dump-database.sh
# Full restore of all schemas: registry, metrics, drizzle

set -euo pipefail

# Configuration
POSTGRES_VERSION=18
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=mcp_registry_admin
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

PG_RESTORE="${POSTGRES_LOCATION}/Postgres.app/Contents/Versions/${POSTGRES_VERSION}/bin/pg_restore"
PSQL="${POSTGRES_LOCATION}/Postgres.app/Contents/Versions/${POSTGRES_VERSION}/bin/psql"

# Parse flags
SKIP_CONFIRM=false
QUIET=false
while [[ $# -gt 0 ]]; do
  case $1 in
    -y|--yes)
      SKIP_CONFIRM=true
      shift
      ;;
    -q|--quiet)
      QUIET=true
      shift
      ;;
    *)
      break
      ;;
  esac
done

log() {
  [[ "${QUIET}" == false ]] && echo "$@" || true
}

# Get project root directory (script is in scripts/db/)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "${SCRIPT_DIR}")")"
BACKUP_DIR="${PROJECT_ROOT}/scripts/database-backups"

# Find backup file to restore
if [[ -n "${1:-}" ]]; then
  BACKUP_FILE="$1"
  if [[ ! -f "${BACKUP_FILE}" ]]; then
    echo "Error: Specified backup file not found: ${BACKUP_FILE}" >&2
    exit 1
  fi
else
  BACKUP_FILE=$(ls -t "${BACKUP_DIR}"/*.tar 2>/dev/null | head -1)
  if [[ -z "${BACKUP_FILE}" ]]; then
    echo "Error: No backup files found in ${BACKUP_DIR}" >&2
    exit 1
  fi
fi

log "Restoring from: ${BACKUP_FILE}"

# Confirm with user (skip if -y flag provided)
if [[ "${SKIP_CONFIRM}" == false ]]; then
  read -p "This will DROP and recreate ALL schemas (registry, metrics, drizzle). Continue? [y/N] " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Restore cancelled"
    exit 0
  fi
fi

# Drop all schemas
log "Dropping existing schemas..."
"${PSQL}" \
  --host="${POSTGRES_HOST}" \
  --port="${POSTGRES_PORT}" \
  --username="${POSTGRES_USER}" \
  --dbname="${POSTGRES_DB}" \
  --quiet \
  --command="
    SET client_min_messages = WARNING;
    DROP SCHEMA IF EXISTS registry CASCADE;
    DROP SCHEMA IF EXISTS metrics CASCADE;
    DROP SCHEMA IF EXISTS drizzle CASCADE;
  "

# Restore from backup
log "Restoring database..."
"${PG_RESTORE}" \
  --host="${POSTGRES_HOST}" \
  --port="${POSTGRES_PORT}" \
  --username="${POSTGRES_USER}" \
  --dbname="${POSTGRES_DB}" \
  --no-owner \
  --no-privileges \
  --exit-on-error \
  "${BACKUP_FILE}"

log "Database restore completed successfully"
