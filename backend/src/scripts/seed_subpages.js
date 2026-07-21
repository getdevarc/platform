require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });
const db = require("../config/db");

async function seedPages() {
    console.log("[Seed] Starting test subpages seeding...");
    try {
        // Find first active track
        const trackRes = await db.query("SELECT id, title FROM learning_tracks WHERE status = 'ACTIVE' LIMIT 1");
        if (trackRes.rows.length === 0) {
            console.log("[Seed] No active tracks found. Creating placeholder track...");
            const insertTrack = await db.query(
                `INSERT INTO learning_tracks (title, slug, description, difficulty, estimated_hours, status)
                 VALUES ('Full-Stack Development Track Test', 'full-stack-track-test', 'Testing subpages curriculum', 'Beginner', 40, 'ACTIVE')
                 RETURNING id`
            );
            trackRes.rows.push(insertTrack.rows[0]);
        }

        const trackId = trackRes.rows[0].id;
        console.log(`[Seed] Using track: "${trackRes.rows[0].title}" (ID: ${trackId})`);

        // Find module or create
        let moduleRes = await db.query("SELECT id, title FROM learning_modules WHERE track_id = $1 LIMIT 1", [trackId]);
        if (moduleRes.rows.length === 0) {
            console.log("[Seed] Creating test modules for track...");
            const insertMod = await db.query(
                `INSERT INTO learning_modules (track_id, title, description, sort_order)
                 VALUES ($1, 'Core Architecture Chapter', 'Foundations of web systems', 1)
                 RETURNING id, title`,
                [trackId]
            );
            moduleRes.rows.push(insertMod.rows[0]);
        }

        const moduleId = moduleRes.rows[0].id;
        console.log(`[Seed] Using module: "${moduleRes.rows[0].title}" (ID: ${moduleId})`);

        // Clear existing pages for clean recreation
        await db.query("DELETE FROM module_pages WHERE module_id = $1", [moduleId]);

        // Insert test pages
        const pages = [
            {
                title: "Introduction to React Hooks",
                slug: "react-hooks-intro",
                display_order: 1,
                estimated_minutes: 15,
                status: "PUBLISHED"
            },
            {
                title: "Advanced State Management Patterns",
                slug: "advanced-state",
                display_order: 2,
                estimated_minutes: 25,
                status: "PUBLISHED"
            },
            {
                title: "React Performance Tuning Guide",
                slug: "performance-tuning",
                display_order: 3,
                estimated_minutes: 30,
                status: "PUBLISHED"
            }
        ];

        for (const pg of pages) {
            const res = await db.query(
                `INSERT INTO module_pages (module_id, title, slug, content, display_order, estimated_minutes, status)
                 VALUES ($1, $2, $3, '', $4, $5, $6)
                 RETURNING id, title`,
                [moduleId, pg.title, pg.slug, pg.display_order, pg.estimated_minutes, pg.status]
            );
            console.log(`[Seed] Inserted page: "${res.rows[0].title}" (ID: ${res.rows[0].id})`);
        }

        console.log("[Seed] Testing pages successfully seeded!");
    } catch (err) {
        console.error("[Seed] Error during seeding:", err);
    } finally {
        await db.end();
        console.log("[Seed] Database connection pool closed.");
    }
}

seedPages();
