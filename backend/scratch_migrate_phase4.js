require("dotenv").config();
const db = require("./src/config/db");
const fs = require("fs");
const path = require("path");

async function runMigration() {
  try {
    const sqlPath = path.join(__dirname, "src/migrations/20260411_create_phase4_tables.sql");
    const sql = fs.readFileSync(sqlPath, "utf8");
    
    console.log("Running Phase 4 migration: interviews & roadmaps...");
    await db.query(sql);
    console.log("Migration successful!");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

runMigration();
