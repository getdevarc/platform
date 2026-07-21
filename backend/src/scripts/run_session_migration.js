require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });
const fs = require("fs");
const path = require("path");
const db = require("../config/db");

async function runMigration() {
    console.log("[Migration] Running session persistence migration...");
    try {
        const sqlPath = path.join(__dirname, "../migrations/20260717_track_session_persistence.sql");
        const sql = fs.readFileSync(sqlPath, "utf8");
        await db.query(sql);
        console.log("[Migration] Successfully applied track session persistence tables modification!");
    } catch (err) {
        console.error("[Migration] Error applying migration:", err);
    } finally {
        await db.end();
        console.log("[Migration] Database connection closed.");
    }
}

runMigration();
