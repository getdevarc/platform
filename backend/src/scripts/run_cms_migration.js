require("dotenv").config();
const fs = require("fs");
const path = require("path");
const db = require("../config/db");

const runMigration = async () => {
    try {
        const sqlPath = path.join(__dirname, "../migrations/20260720_learning_pages_cms.sql");
        const migrationSql = fs.readFileSync(sqlPath, "utf8");
        console.log("Running CMS migration from:", sqlPath);
        await db.query(migrationSql);
        console.log("CMS migration completed successfully.");
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
};

runMigration();
