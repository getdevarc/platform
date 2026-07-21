-- Migration: Restructure Curated Resources DDL

-- 1. Add description column to curated_resources for detailed editorial notes
ALTER TABLE curated_resources ADD COLUMN IF NOT EXISTS description TEXT;

-- 2. Add explicit display_order to curated_resources for custom sorting within a page
ALTER TABLE curated_resources ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 1 NOT NULL;

-- 3. Add status column to prepare for Resource status lifecycle values (Draft, Published, Archived)
ALTER TABLE curated_resources ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'PUBLISHED' NOT NULL;
ALTER TABLE curated_resources DROP CONSTRAINT IF EXISTS check_resource_status;
ALTER TABLE curated_resources ADD CONSTRAINT check_resource_status CHECK (status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED'));

-- Normalize existing types to conform to the new enum
UPDATE curated_resources SET type = 'Article' WHERE LOWER(type) IN ('link', 'article', 'txt', 'document');
UPDATE curated_resources SET type = 'Video' WHERE LOWER(type) IN ('video', 'youtube');
UPDATE curated_resources SET type = 'GitHub' WHERE LOWER(type) IN ('github', 'repo');
UPDATE curated_resources SET type = 'Official Documentation' WHERE LOWER(type) IN ('docs', 'documentation', 'official documentation');
UPDATE curated_resources SET type = 'Other' WHERE type NOT IN (
  'Official Documentation', 'Article', 'Video', 'GitHub', 'Book', 'Course', 'Cheat Sheet', 'Practice'
);

-- 4. Add check constraint to enforce fixed Resource Type enum values
ALTER TABLE curated_resources DROP CONSTRAINT IF EXISTS check_resource_type;
ALTER TABLE curated_resources ADD CONSTRAINT check_resource_type CHECK (type IN (
  'Official Documentation', 'Article', 'Video', 'GitHub', 'Book', 'Course', 'Cheat Sheet', 'Practice', 'Other'
));
