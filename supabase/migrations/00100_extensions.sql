-- ============================================
-- Migration: 00100_extensions.sql
-- Description: Install required PostgreSQL extensions
-- Dependencies: None (must run first)
-- ============================================

-- Rollback:
-- DROP EXTENSION IF EXISTS "uuid-ossp" CASCADE;
-- DROP EXTENSION IF EXISTS "pg_trgm" CASCADE;
-- DROP EXTENSION IF EXISTS "pgcrypto" CASCADE;

-- ============================================
-- UUID Generation Extension
-- ============================================
-- Provides uuid_generate_v4() and gen_random_uuid() functions
-- Used for primary keys across all tables
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Full-Text Search Extension
-- ============================================
-- Provides trigram matching for fuzzy text search
-- Used for product search, artist search, blog search
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================
-- Cryptography Extension
-- ============================================
-- Provides cryptographic functions (hashing, encryption)
-- Used for secure tokens, API keys, etc.
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- Verification
-- ============================================
-- Verify extensions are installed
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp') THEN
    RAISE EXCEPTION 'Extension uuid-ossp failed to install';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm') THEN
    RAISE EXCEPTION 'Extension pg_trgm failed to install';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pgcrypto') THEN
    RAISE EXCEPTION 'Extension pgcrypto failed to install';
  END IF;
  
  RAISE NOTICE 'All extensions installed successfully';
END $$;

-- ============================================
-- Comments
-- ============================================
COMMENT ON EXTENSION "uuid-ossp" IS 'UUID generation functions for primary keys';
COMMENT ON EXTENSION "pg_trgm" IS 'Trigram matching for full-text search';
COMMENT ON EXTENSION "pgcrypto" IS 'Cryptographic functions for security';

