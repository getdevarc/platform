-- Migration: Create initial base tables for DevArc platform
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           VARCHAR(100) NOT NULL,
  email          VARCHAR(150) UNIQUE NOT NULL,
  password       TEXT NOT NULL,
  role           VARCHAR(50),
  target_domain  VARCHAR(100),
  resume_text    TEXT,
  career_answers JSONB,
  created_at     TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS problems (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       VARCHAR(255) NOT NULL,
  description TEXT,
  difficulty  VARCHAR(50),
  created_at  TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS solve_sessions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  problem_id UUID REFERENCES problems(id) ON DELETE CASCADE,
  score      INT DEFAULT 100,
  status     VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  ended_at   TIMESTAMP
);

CREATE TABLE IF NOT EXISTS solve_events (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES solve_sessions(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  metadata   JSONB,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS submissions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  problem_id UUID REFERENCES problems(id) ON DELETE CASCADE,
  code       TEXT NOT NULL,
  language   VARCHAR(50) NOT NULL,
  score      INTEGER DEFAULT 0,
  penalty    INTEGER DEFAULT 0,
  status     VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS ai_logs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  problem_id UUID REFERENCES problems(id) ON DELETE CASCADE,
  prompt     TEXT NOT NULL,
  response   TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);
