-- Migration to create user_module_resources table for storing AI recommended links and future completion tracking
CREATE TABLE IF NOT EXISTS user_module_resources (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  module_id   UUID REFERENCES learning_modules(id) ON DELETE CASCADE,
  resources   JSONB NOT NULL, -- Storing JSON list of resource objects: title, category, reason, difficulty, url, is_official, source_name, is_bookmarked, is_completed, additional_metadata
  created_at  TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at  TIMESTAMP DEFAULT NOW() NOT NULL,
  CONSTRAINT unique_user_module_resource UNIQUE (user_id, module_id)
);
