-- Migration: Create study_guides table
CREATE TABLE IF NOT EXISTS study_guides (
    id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                UUID REFERENCES users(id) ON DELETE CASCADE,
    step_title             VARCHAR(255) NOT NULL,
    content                TEXT NOT NULL,
    recommended_resources  JSONB DEFAULT '[]'::jsonb,
    created_at             TIMESTAMP DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, step_title)
);

ALTER TABLE study_guides ADD COLUMN IF NOT EXISTS recommended_resources JSONB DEFAULT '[]'::jsonb;

-- Index for faster query performance by user
CREATE INDEX IF NOT EXISTS idx_study_guides_user ON study_guides(user_id);
