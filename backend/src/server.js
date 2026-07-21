require("dotenv").config();

const app = require("./app");
const db = require("./config/db");
const healthScheduler = require("./services/healthScheduler");

const PORT = process.env.PORT || 5050;

const initDb = async () => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS career_plans (
        id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id             UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
        summary             TEXT NOT NULL,
        estimated_timeline  VARCHAR(100) DEFAULT '3 months',
        created_at          TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at          TIMESTAMP DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS roadmap_steps (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id       UUID REFERENCES users(id) ON DELETE CASCADE,
        title         VARCHAR(255) NOT NULL,
        description   TEXT,
        type          VARCHAR(50) DEFAULT 'skill',
        status        VARCHAR(50) DEFAULT 'NOT_STARTED',
        duration      INTEGER DEFAULT 4,
        sort_order    INTEGER NOT NULL,
        created_at    TIMESTAMP DEFAULT NOW() NOT NULL,
        UNIQUE(user_id, title)
      );

      CREATE TABLE IF NOT EXISTS study_guides (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
        step_id     UUID REFERENCES roadmap_steps(id) ON DELETE CASCADE,
        content     TEXT NOT NULL,
        created_at  TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at  TIMESTAMP DEFAULT NOW() NOT NULL,
        UNIQUE(user_id, step_id)
      );

      ALTER TABLE study_guides ADD COLUMN IF NOT EXISTS step_id UUID REFERENCES roadmap_steps(id) ON DELETE CASCADE;
      ALTER TABLE study_guides ADD COLUMN IF NOT EXISTS step_title VARCHAR(255);
      ALTER TABLE study_guides ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW() NOT NULL;
      ALTER TABLE study_guides ALTER COLUMN step_title DROP NOT NULL;
      
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'study_guides_user_id_step_id_key'
        ) THEN
          ALTER TABLE study_guides ADD CONSTRAINT study_guides_user_id_step_id_key UNIQUE(user_id, step_id);
        END IF;
      END $$;

      CREATE TABLE IF NOT EXISTS study_guide_resources (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
        step_id     UUID REFERENCES roadmap_steps(id) ON DELETE CASCADE,
        title       VARCHAR(255) NOT NULL,
        url         TEXT NOT NULL,
        source      VARCHAR(100) NOT NULL,
        reason      TEXT,
        created_at  TIMESTAMP DEFAULT NOW() NOT NULL,
        UNIQUE(step_id, title)
      );

      CREATE TABLE IF NOT EXISTS practice_projects (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
        step_id         UUID REFERENCES roadmap_steps(id) ON DELETE CASCADE,
        title           VARCHAR(255) NOT NULL,
        description     TEXT,
        difficulty      VARCHAR(50) DEFAULT 'beginner',
        estimated_time  VARCHAR(100),
        tasks           JSONB NOT NULL DEFAULT '[]'::jsonb,
        created_at      TIMESTAMP DEFAULT NOW() NOT NULL,
        UNIQUE(step_id, title)
      );

      CREATE TABLE IF NOT EXISTS interview_preps (
        id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id             UUID REFERENCES users(id) ON DELETE CASCADE,
        step_id             UUID REFERENCES roadmap_steps(id) ON DELETE CASCADE,
        difficulty          VARCHAR(50) NOT NULL,
        question_text       TEXT NOT NULL,
        expected_answer     TEXT,
        tags                VARCHAR(50)[] DEFAULT '{}'::varchar[],
        estimated_duration  INTEGER DEFAULT 15,
        created_at          TIMESTAMP DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS revision_checklists (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
        step_id     UUID REFERENCES roadmap_steps(id) ON DELETE CASCADE,
        title       VARCHAR(255) NOT NULL,
        completed   BOOLEAN DEFAULT FALSE NOT NULL,
        created_at  TIMESTAMP DEFAULT NOW() NOT NULL,
        UNIQUE(step_id, title)
      );

      CREATE INDEX IF NOT EXISTS idx_study_guides_step ON study_guides(step_id);
      CREATE INDEX IF NOT EXISTS idx_study_guide_resources_step ON study_guide_resources(step_id);
      CREATE INDEX IF NOT EXISTS idx_practice_projects_step ON practice_projects(step_id);
      CREATE INDEX IF NOT EXISTS idx_interview_preps_step ON interview_preps(step_id);
      CREATE INDEX IF NOT EXISTS idx_revision_checklists_step ON revision_checklists(step_id);
      CREATE INDEX IF NOT EXISTS idx_user_enrolled_tracks_track ON user_enrolled_tracks(track_id);
      CREATE INDEX IF NOT EXISTS idx_module_pages_status ON module_pages(status);
    `);
    console.log("[DB] career system base tables and performance indexes verified.");
  } catch (err) {
    console.error("[DB] Failed to verify career system tables and indexes:", err);
  }
};

const server = app.listen(PORT, async () => {
  await initDb();
  console.log(`DevArc API running on port ${PORT}`);
  healthScheduler.start();
});

// Initialize Socket.IO real-time event service with the server instance
const socketService = require("./services/socketService");
socketService.init(server);

let isShuttingDown = false;

const gracefulShutdown = (signal) => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`[SERVER] Received ${signal}. Starting graceful shutdown...`);

  healthScheduler.stop();

  const forcedTimeout = setTimeout(() => {
    console.error("[SERVER] Graceful shutdown timed out. Forcing exit...");
    process.exit(1);
  }, 10000);

  // Stop accepting new HTTP requests
  server.close(async (err) => {
    if (err) {
      console.error("[SERVER] Error during server socket close:", err);
      clearTimeout(forcedTimeout);
      process.exit(1);
    }
    console.log("[SERVER] HTTP server closed.");

    // Close Database Pool
    try {
      await db.end();
      console.log("[DB] Database connection pool closed.");
      clearTimeout(forcedTimeout);
      process.exit(0);
    } catch (dbErr) {
      console.error("[DB] Database pool shutdown error:", dbErr);
      clearTimeout(forcedTimeout);
      process.exit(1);
    }
  });
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));