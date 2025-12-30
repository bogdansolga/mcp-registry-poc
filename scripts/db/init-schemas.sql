-- MCP Registry Database Initialization
-- Creates schemas for the MCP Registry application

-- Create registry schema for MCP server registration
CREATE SCHEMA IF NOT EXISTS registry;

-- Create metrics schema for health and usage tracking
CREATE SCHEMA IF NOT EXISTS metrics;

-- Enums are created by Drizzle in the registry schema

-- Log initialization
DO $$
BEGIN
  RAISE NOTICE '=== MCP Registry Schemas Initialized ===';
  RAISE NOTICE 'Created schemas: registry, metrics';
  RAISE NOTICE 'Created enums: server_type, server_status';
END $$;
