-- Migration: Sprint 10 Learning CMS & Content Management Architecture

-- 1. Expand page status lifecycle checks ('DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED')
ALTER TABLE module_pages DROP CONSTRAINT IF EXISTS module_pages_status_check;
ALTER TABLE module_pages ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'DRAFT' NOT NULL;
ALTER TABLE module_pages ADD CONSTRAINT module_pages_status_check CHECK (status IN ('DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED'));

-- 2. Add rich lesson content properties to module_pages
ALTER TABLE module_pages ADD COLUMN IF NOT EXISTS difficulty VARCHAR(50) DEFAULT 'BEGINNER' CHECK (difficulty IN ('BEGINNER', 'INTERMEDIATE', 'ADVANCED')) NOT NULL;
ALTER TABLE module_pages ADD COLUMN IF NOT EXISTS learning_objectives TEXT DEFAULT '' NOT NULL;
ALTER TABLE module_pages ADD COLUMN IF NOT EXISTS code_snippets TEXT DEFAULT '' NOT NULL;
ALTER TABLE module_pages ADD COLUMN IF NOT EXISTS best_practices TEXT DEFAULT '' NOT NULL;
ALTER TABLE module_pages ADD COLUMN IF NOT EXISTS common_mistakes TEXT DEFAULT '' NOT NULL;
ALTER TABLE module_pages ADD COLUMN IF NOT EXISTS real_world_examples TEXT DEFAULT '' NOT NULL;
ALTER TABLE module_pages ADD COLUMN IF NOT EXISTS summary TEXT DEFAULT '' NOT NULL;

-- 3. Add estimated reading time / pre-reqs / navigation sequence links to pages
ALTER TABLE module_pages ADD COLUMN IF NOT EXISTS prerequisites TEXT DEFAULT '' NOT NULL;
ALTER TABLE module_pages ADD COLUMN IF NOT EXISTS previous_page_id UUID REFERENCES module_pages(id) ON DELETE SET NULL;
ALTER TABLE module_pages ADD COLUMN IF NOT EXISTS next_page_id UUID REFERENCES module_pages(id) ON DELETE SET NULL;
ALTER TABLE module_pages ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- 4. Enable display order & description on curated resources
ALTER TABLE curated_resources ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 1 NOT NULL;
ALTER TABLE curated_resources ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '' NOT NULL;

-- 5. Version History Schema Hook
CREATE TABLE IF NOT EXISTS module_page_versions (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_id        UUID REFERENCES module_pages(id) ON DELETE CASCADE,
    version        INTEGER NOT NULL,
    content        JSONB NOT NULL, -- full dump of lesson properties
    created_by     UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at     TIMESTAMP DEFAULT NOW() NOT NULL,
    UNIQUE(page_id, version)
);
