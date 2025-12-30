-- MCP Registry Database Initialization
-- Creates schemas for the MCP Registry application

-- Create registry schema for MCP server registration
CREATE SCHEMA IF NOT EXISTS registry;

-- Create metrics schema for health and usage tracking
CREATE SCHEMA IF NOT EXISTS metrics;

-- Create public enums that will be used across schemas
-- These are in public schema so they can be referenced by multiple schemas

-- Server type enum
DO $$ BEGIN
  CREATE TYPE public.server_type AS ENUM ('stdio', 'sse', 'mock');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Server status enum
DO $$ BEGIN
  CREATE TYPE public.server_status AS ENUM ('active', 'inactive', 'error');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Log initialization
DO $$
BEGIN
  RAISE NOTICE '=== MCP Registry Schemas Initialized ===';
  RAISE NOTICE 'Created schemas: registry, metrics';
  RAISE NOTICE 'Created enums: server_type, server_status';
END $$;
