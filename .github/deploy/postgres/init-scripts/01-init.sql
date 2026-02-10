-- ============================================================================
-- PostgreSQL Initialization Script for nself-chat
-- ============================================================================
-- Creates necessary extensions and initial schema
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create backup directory for WAL archiving
\! mkdir -p /backups/wal

-- Set up performance monitoring
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';

-- Create read-only user for monitoring
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'nchat_readonly') THEN
        CREATE ROLE nchat_readonly WITH LOGIN PASSWORD 'readonly_password_change_me';
        GRANT CONNECT ON DATABASE nchat TO nchat_readonly;
        GRANT USAGE ON SCHEMA public TO nchat_readonly;
        GRANT SELECT ON ALL TABLES IN SCHEMA public TO nchat_readonly;
        ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO nchat_readonly;
    END IF;
END
$$;

-- Create backup user
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'nchat_backup') THEN
        CREATE ROLE nchat_backup WITH LOGIN PASSWORD 'backup_password_change_me';
        GRANT CONNECT ON DATABASE nchat TO nchat_backup;
        ALTER ROLE nchat_backup WITH REPLICATION;
    END IF;
END
$$;

-- Set up connection pooling settings
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET shared_buffers = '2GB';

-- Vacuum and analyze
VACUUM ANALYZE;
