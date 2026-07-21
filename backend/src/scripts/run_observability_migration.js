require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });
const fs = require("fs");
const path = require("path");
const db = require("../config/db");

const MIGRATION_PATH = path.join(__dirname, "../migrations/20260718_observability_schema.sql");

async function executeMigration() {
    console.log("[Migration] Executing platform observability & health foundation DDL...");
    try {
        const sql = fs.readFileSync(MIGRATION_PATH, "utf8");
        await db.query(sql);
        console.log("[Migration] Database health logs table created successfully.");
    } catch (err) {
        console.error("[Migration] Error running migration:", err);
        process.exit(1);
    } finally {
        await db.end();
        console.log("[Migration] Database connection pool closed.");
    }
}

executeMigration();
