-- Migration: Create tables for Learn Module Phase 1 Foundation

CREATE TABLE IF NOT EXISTS learning_tracks (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug             VARCHAR(100) UNIQUE NOT NULL,
  title            VARCHAR(255) UNIQUE NOT NULL,
  description      TEXT NOT NULL,
  difficulty       VARCHAR(50) DEFAULT 'beginner', -- beginner, intermediate, advanced
  estimated_hours  INTEGER DEFAULT 10,
  icon             VARCHAR(100) DEFAULT 'book-open', -- maps to Lucide icon strings
  created_at       TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS learning_modules (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id    UUID REFERENCES learning_tracks(id) ON DELETE CASCADE,
  title       VARCHAR(255) NOT NULL,
  sort_order  INTEGER NOT NULL,
  created_at  TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE(track_id, title)
);

CREATE TABLE IF NOT EXISTS user_enrolled_tracks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES users(id) ON DELETE CASCADE,
  track_id     UUID REFERENCES learning_tracks(id) ON DELETE CASCADE,
  status       VARCHAR(50) DEFAULT 'ACTIVE' CHECK (status IN ('NOT_STARTED', 'ACTIVE', 'COMPLETED')),
  enrolled_at  TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, track_id)
);

-- Index mappings
CREATE INDEX IF NOT EXISTS idx_learning_modules_track ON learning_modules(track_id);
CREATE INDEX IF NOT EXISTS idx_user_enrolled_tracks_user ON user_enrolled_tracks(user_id);
