-- Migration: Admin Updates, Curated Resources and Polymorphic Mappings

-- 1. Add status to learning_tracks to support soft archiving
ALTER TABLE learning_tracks ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'ACTIVE' NOT NULL;

-- 2. Add last_login_at to users to track login telemetry
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP;

-- 3. Create curated_resources table supporting dynamic tags and JSONB metadata
CREATE TABLE IF NOT EXISTS curated_resources (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title       VARCHAR(255) NOT NULL,
    url         TEXT NOT NULL,
    source      VARCHAR(100) NOT NULL,
    reason      TEXT,
    tags        VARCHAR(50)[] DEFAULT '{}'::varchar[],
    metadata    JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at  TIMESTAMP DEFAULT NOW() NOT NULL
);

-- 4. Create curated_resource_associations table for polymorphic mappings
CREATE TABLE IF NOT EXISTS curated_resource_associations (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_id         UUID REFERENCES curated_resources(id) ON DELETE CASCADE,
    associated_type     VARCHAR(50) NOT NULL, -- 'track', 'module'
    associated_id       UUID NOT NULL,
    created_at          TIMESTAMP DEFAULT NOW() NOT NULL,
    UNIQUE(resource_id, associated_type, associated_id)
);

-- Indexes for performant lookups
CREATE INDEX IF NOT EXISTS idx_curated_resources_tags ON curated_resources USING gin (tags);
CREATE INDEX IF NOT EXISTS idx_curated_assoc_lookup ON curated_resource_associations(associated_type, associated_id);
