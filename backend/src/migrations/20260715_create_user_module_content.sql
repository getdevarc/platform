-- Migration to create user_module_content table storing AI-generated study contents for study modules
CREATE TABLE IF NOT EXISTS user_module_content (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  module_id   UUID REFERENCES learning_modules(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  created_at  TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at  TIMESTAMP DEFAULT NOW() NOT NULL,
  CONSTRAINT unique_user_module UNIQUE (user_id, module_id)
);
