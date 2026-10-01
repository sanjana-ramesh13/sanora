-- Sanora Migration 001: Enable PostgreSQL extensions
-- Run first in Supabase SQL Editor

create extension if not exists "uuid-ossp";   -- for uuid_generate_v4()
create extension if not exists "pg_trgm";     -- for future fuzzy text search on item names/tags
