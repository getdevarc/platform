require("dotenv").config();
const db = require("./src/config/db");
const fs = require("fs");
const path = require("path");

async function executeSqlFile(filePath) {
    const sql = fs.readFileSync(filePath, "utf8");
    console.log(`Running SQL from: ${path.basename(filePath)}...`);
    await db.query(sql);
}

async function runAll() {
    try {
        console.log("🚀 Starting database initialization and migrations...");

        // 1. Initial base tables migration
        const baseTablesPath = path.join(__dirname, "src/migrations/20260703_init_base_tables.sql");
        await executeSqlFile(baseTablesPath);
        console.log("✅ Initial base tables created.");

        // 2. Phase 4 tables migration
        const phase4Path = path.join(__dirname, "src/migrations/20260411_create_phase4_tables.sql");
        await executeSqlFile(phase4Path);
        console.log("✅ Phase 4 tables created (interviews & roadmaps).");

        // 3. Solve insights table migration
        const insightsPath = path.join(__dirname, "src/migrations/20260411_create_solve_insights.sql");
        await executeSqlFile(insightsPath);
        console.log("✅ Solve insights table created.");

        // 4. Overhaul migrations
        console.log("Running overhaul updates...");
        await db.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS role VARCHAR(50),
      ADD COLUMN IF NOT EXISTS target_domain VARCHAR(100),
      ADD COLUMN IF NOT EXISTS resume_text TEXT,
      ADD COLUMN IF NOT EXISTS career_answers JSONB;
    `);
        console.log("✅ Users table structure checked/updated.");

        await db.query(`
      ALTER TABLE submissions 
      ADD COLUMN IF NOT EXISTS score INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS penalty INTEGER DEFAULT 0;
    `);
        console.log("✅ Submissions table structure checked/updated.");

        console.log("🎉 ALL MIGRATIONS COMPLETED SUCCESSFULLY!");
        process.exit(0);
    } catch (err) {
        console.error("❌ Migration failed with error:", err);
        process.exit(1);
    }
}

runAll();
