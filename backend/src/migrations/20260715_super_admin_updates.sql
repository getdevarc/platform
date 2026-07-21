-- Migration: Super Admin Updates & Platform Settings with Auditing
-- 1. Add display_order to learning_tracks
ALTER TABLE learning_tracks ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 1 NOT NULL;

-- 2. Add Category, Provider, Difficulty, Official Resource, Typename columns to curated_resources
ALTER TABLE curated_resources ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'General' NOT NULL;
ALTER TABLE curated_resources ADD COLUMN IF NOT EXISTS provider VARCHAR(100) DEFAULT 'External' NOT NULL;
ALTER TABLE curated_resources ADD COLUMN IF NOT EXISTS difficulty VARCHAR(50) DEFAULT 'beginner' NOT NULL;
ALTER TABLE curated_resources ADD COLUMN IF NOT EXISTS is_official BOOLEAN DEFAULT FALSE NOT NULL;
ALTER TABLE curated_resources ADD COLUMN IF NOT EXISTS type VARCHAR(100) DEFAULT 'link' NOT NULL; -- flexible typestring for link, pdf, video, etc.

-- 3. Create platform_settings table with audit columns
CREATE TABLE IF NOT EXISTS platform_settings (
    key          VARCHAR(100) PRIMARY KEY,
    value        JSONB NOT NULL,
    description  TEXT,
    updated_by   UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_at   TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Seed default settings
INSERT INTO platform_settings (key, value, description) VALUES
('max_daily_credits', '{"limit": 50}'::jsonb, 'Maximum dynamic AI generation credits allowed per user per day'),
('default_difficulty', '{"level": "beginner"}'::jsonb, 'Fallback difficulty for newly generated customized roadmaps'),
('maintenance_mode', '{"enabled": false}'::jsonb, 'Puts platform in read-only maintenance mode'),
('allow_registration', '{"allowed": true}'::jsonb, 'Enables or restricts public sign-up registration flows')
ON CONFLICT (key) DO NOTHING;
