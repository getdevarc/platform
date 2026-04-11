require("dotenv").config({ path: "./.env" });
const db = require("./src/config/db");

async function migrate() {
  console.log("🚀 Starting Overhaul Migrations (Backend Context)...");
  try {
    // Users updates
    await db.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS role VARCHAR(50),
      ADD COLUMN IF NOT EXISTS target_domain VARCHAR(100),
      ADD COLUMN IF NOT EXISTS resume_text TEXT,
      ADD COLUMN IF NOT EXISTS career_answers JSONB;
    `);
    console.log("✅ Users table updated.");

    // Submissions updates
    await db.query(`
      ALTER TABLE submissions 
      ADD COLUMN IF NOT EXISTS score INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS penalty INTEGER DEFAULT 0;
    `);
    console.log("✅ Submissions table updated.");

    console.log("🎉 ALL MIGRATIONS COMPLETED SUCCESSFULLY!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Migration Failed:", err);
    process.exit(1);
  }
}

migrate();
