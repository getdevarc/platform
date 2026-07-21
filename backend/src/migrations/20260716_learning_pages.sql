-- Migration: Sprint 7.1 Learning Content Engine Foundation
-- 1. Create module_pages table
CREATE TABLE IF NOT EXISTS module_pages (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id          UUID REFERENCES learning_modules(id) ON DELETE CASCADE,
    title              VARCHAR(255) NOT NULL,
    slug               VARCHAR(100) NOT NULL,
    content            TEXT DEFAULT '' NOT NULL,
    display_order      INTEGER DEFAULT 1 NOT NULL,
    estimated_minutes  INTEGER DEFAULT 10 NOT NULL,
    status             VARCHAR(50) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')) NOT NULL,
    created_at         TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at         TIMESTAMP DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_module_page_slug UNIQUE (module_id, slug),
    CONSTRAINT unique_module_page_title UNIQUE (module_id, title)
);

-- 2. Create user_page_progress table
CREATE TABLE IF NOT EXISTS user_page_progress (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID REFERENCES users(id) ON DELETE CASCADE,
    page_id        UUID REFERENCES module_pages(id) ON DELETE CASCADE,
    is_completed   BOOLEAN DEFAULT FALSE NOT NULL,
    is_bookmarked  BOOLEAN DEFAULT FALSE NOT NULL,
    notes          TEXT,
    created_at     TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at     TIMESTAMP DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_user_page UNIQUE (user_id, page_id)
);

-- 3. Create indexes for quick lookup
CREATE INDEX IF NOT EXISTS idx_module_pages_module ON module_pages(module_id);
CREATE INDEX IF NOT EXISTS idx_user_page_progress_user ON user_page_progress(user_id);
