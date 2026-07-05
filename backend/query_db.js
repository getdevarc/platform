require("dotenv").config();
const db = require("./src/config/db");
async function run() {
    const users = await db.query("SELECT id, name, email, role, target_domain, resume_text FROM users");
    console.log("USERS:", users.rows);
    const roadmaps = await db.query("SELECT * FROM roadmaps");
    console.log("ROADMAPS:", roadmaps.rows);
    process.exit(0);
}
run();
