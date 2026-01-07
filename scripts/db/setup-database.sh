#!/usr/bin/env bash

# Database setup script for MCP Registry
# Creates the mcp_registry database and initializes schemas

set -euo pipefail

# Configuration
POSTGRES_VERSION=18
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_SUPERUSER=postgres  # PostgreSQL superuser for creating database
POSTGRES_APP_USER=mcp_registry_admin  # Application user for access
POSTGRES_DB=mcp_registry
POSTGRES_APP_PASSWORD=zWyM00mZBHGi2IYTrdkPgYPKoOZYpm2ZLg7m67  # Default password

# Detect machine and set Postgres location
CURRENT_MACHINE=$(hostname -s)
if [[ ${CURRENT_MACHINE} == 'MacStudio' ]]; then
  POSTGRES_LOCATION=/Volumes/NVMe/MacOS/Apps
elif [[ -d "/Applications/Postgres.app" ]]; then
  POSTGRES_LOCATION=/Applications
else
  POSTGRES_LOCATION=/Volumes/Media/MacOS/Apps
fi

PSQL="${POSTGRES_LOCATION}/Postgres.app/Contents/Versions/${POSTGRES_VERSION}/bin/psql"
CREATEDB="${POSTGRES_LOCATION}/Postgres.app/Contents/Versions/${POSTGRES_VERSION}/bin/createdb"

# Get project root directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INIT_SQL="${SCRIPT_DIR}/init-schemas.sql"

echo "=== MCP Registry Database Setup ==="
echo ""

# Create user if it doesn't exist
echo "Ensuring user ${POSTGRES_APP_USER} exists..."
"${PSQL}" \
  --host="${POSTGRES_HOST}" \
  --port="${POSTGRES_PORT}" \
  --username="${POSTGRES_SUPERUSER}" \
  --dbname=postgres \
  --quiet \
  --command="
    DO \$\$
    BEGIN
      IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '${POSTGRES_APP_USER}') THEN
        CREATE ROLE ${POSTGRES_APP_USER} WITH LOGIN PASSWORD '${POSTGRES_APP_PASSWORD}';
        RAISE NOTICE 'Created user ${POSTGRES_APP_USER}';
      ELSE
        RAISE NOTICE 'User ${POSTGRES_APP_USER} already exists';
      END IF;
    END
    \$\$;
  "

# Check if database already exists
DB_EXISTS=$("${PSQL}" \
  --host="${POSTGRES_HOST}" \
  --port="${POSTGRES_PORT}" \
  --username="${POSTGRES_SUPERUSER}" \
  --dbname=postgres \
  --tuples-only \
  --quiet \
  --command="SELECT 1 FROM pg_database WHERE datname='${POSTGRES_DB}'" | xargs)

if [[ "${DB_EXISTS}" == "1" ]]; then
  echo "Database '${POSTGRES_DB}' already exists."
  read -p "Do you want to drop and recreate it? [y/N] " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Dropping database '${POSTGRES_DB}'..."
    "${PSQL}" \
      --host="${POSTGRES_HOST}" \
      --port="${POSTGRES_PORT}" \
      --username="${POSTGRES_SUPERUSER}" \
      --dbname=postgres \
      --quiet \
      --command="DROP DATABASE IF EXISTS ${POSTGRES_DB};"
  else
    echo "Setup cancelled"
    exit 0
  fi
fi

# Create database
echo "Creating database '${POSTGRES_DB}'..."
"${CREATEDB}" \
  --host="${POSTGRES_HOST}" \
  --port="${POSTGRES_PORT}" \
  --username="${POSTGRES_SUPERUSER}" \
  --owner="${POSTGRES_APP_USER}" \
  "${POSTGRES_DB}"

# Initialize schemas
echo "Initializing schemas (registry, metrics)..."
"${PSQL}" \
  --host="${POSTGRES_HOST}" \
  --port="${POSTGRES_PORT}" \
  --username="${POSTGRES_SUPERUSER}" \
  --dbname="${POSTGRES_DB}" \
  --quiet \
  --file="${INIT_SQL}"

# Grant all privileges to application user and transfer schema ownership
echo "Granting privileges to ${POSTGRES_APP_USER}..."
"${PSQL}" \
  --host="${POSTGRES_HOST}" \
  --port="${POSTGRES_PORT}" \
  --username="${POSTGRES_SUPERUSER}" \
  --dbname="${POSTGRES_DB}" \
  --quiet \
  --command="
    GRANT ALL PRIVILEGES ON DATABASE ${POSTGRES_DB} TO ${POSTGRES_APP_USER};
    ALTER SCHEMA registry OWNER TO ${POSTGRES_APP_USER};
    ALTER SCHEMA metrics OWNER TO ${POSTGRES_APP_USER};
    GRANT ALL ON SCHEMA registry TO ${POSTGRES_APP_USER};
    GRANT ALL ON SCHEMA metrics TO ${POSTGRES_APP_USER};
    GRANT ALL ON SCHEMA public TO ${POSTGRES_APP_USER};
    GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA registry TO ${POSTGRES_APP_USER};
    GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA metrics TO ${POSTGRES_APP_USER};
    GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA registry TO ${POSTGRES_APP_USER};
    GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA metrics TO ${POSTGRES_APP_USER};
    ALTER DEFAULT PRIVILEGES IN SCHEMA registry GRANT ALL PRIVILEGES ON TABLES TO ${POSTGRES_APP_USER};
    ALTER DEFAULT PRIVILEGES IN SCHEMA registry GRANT ALL PRIVILEGES ON SEQUENCES TO ${POSTGRES_APP_USER};
    ALTER DEFAULT PRIVILEGES IN SCHEMA registry GRANT ALL PRIVILEGES ON TYPES TO ${POSTGRES_APP_USER};
    ALTER DEFAULT PRIVILEGES IN SCHEMA metrics GRANT ALL PRIVILEGES ON TABLES TO ${POSTGRES_APP_USER};
    ALTER DEFAULT PRIVILEGES IN SCHEMA metrics GRANT ALL PRIVILEGES ON SEQUENCES TO ${POSTGRES_APP_USER};
  "

echo ""
echo "=== Setup Complete ==="
echo "Database: ${POSTGRES_DB}"
echo "Owner: ${POSTGRES_APP_USER}"
echo "Schemas: registry, metrics"
echo ""
echo "Next steps:"
echo "1. Update your .env file with: DATABASE_URL=postgresql://${POSTGRES_APP_USER}:<password>@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}"
echo "2. Run 'npm install' to install dependencies"
echo "3. Run 'npm run db:push' to create tables (when Drizzle is configured)"
echo ""
