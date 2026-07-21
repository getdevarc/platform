require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });
const fs = require("fs");
const path = require("path");
const db = require("../config/db");

const MIGRATION_PATH = path.join(__dirname, "../migrations/20260715_create_learn_tables.sql");
const CONTENT_MIGRATION_PATH = path.join(__dirname, "../migrations/20260715_create_user_module_content.sql");
const RESOURCE_MIGRATION_PATH = path.join(__dirname, "../migrations/20260715_create_user_module_resources.sql");

const SEED_TRACKS = [
    {
        slug: 'frontend-architecture',
        title: 'Frontend Architecture Masterclass',
        description: 'Master advanced frontend performance, state management trees, dynamic animations, and Next.js compiler strategies.',
        difficulty: 'intermediate',
        estimated_hours: 15,
        icon: 'layout',
        modules: [
            'HTML5 / Modern styling guidelines Layouts',
            'State machines and client state hooks',
            'Rendering pipelines: ISR, SSR, and partial hydration',
            'Web performance benchmarks and optimization metrics'
        ]
    },
    {
        slug: 'backend-engineering',
        title: 'Backend & Systems Engineering',
        description: 'Build fast production-grade APIs, master database optimization queries, configure caching paradigms, and microservice messaging.',
        difficulty: 'advanced',
        estimated_hours: 20,
        icon: 'server',
        modules: [
            'RESTful API and controller route mappings',
            'Database queries, transactions and index patterns',
            'Distributed caching and background worker tasks',
            'Docker containerization and deployment pipelines'
        ]
    },
    {
        slug: 'dsa-algorithms',
        title: 'Core DSA & Algorithm Workspaces',
        description: 'Master key dynamic patterns, graph connectivity, tree traversals, and recursion techniques.',
        difficulty: 'beginner',
        estimated_hours: 12,
        icon: 'code-2',
        modules: [
            'Complexity benchmarks, Big O analysis',
            'Linked Lists, Stacks, Queues',
            'Trees traversing and Graph search parameters',
            'Dynamic programming constraints'
        ]
    },
    {
        slug: 'react-advanced',
        title: 'React Advanced',
        description: 'Deep dive into advanced patterns: concurrent rendering, custom hooks state management, server components, and performance optimizations.',
        difficulty: 'advanced',
        estimated_hours: 12,
        icon: 'layout',
        modules: [
            'Concurrent rendering & transition APIs',
            'Custom hooks & state synchronization controls',
            'Next.js App router patterns & Server Components'
        ]
    },
    {
        slug: 'devops-docker',
        title: 'Docker & Containers',
        description: 'Learn the essentials of containerization: Dockerfiles, multi-stage builds, orchestration, local volumes, network rules, and compose orchestrator.',
        difficulty: 'intermediate',
        estimated_hours: 8,
        icon: 'server',
        modules: [
            'Docker configurations & multi-stage builds',
            'Compose orchestration & local volumes networking',
            'Security hardening & registry deployment workflows'
        ]
    },
    {
        slug: 'cloud-aws',
        title: 'AWS Cloud Architecture',
        description: 'Understand core cloud infrastructure concepts: VPS subnet topology, IAM security rules, EC2 compute scaling, and RDS storage services.',
        difficulty: 'intermediate',
        estimated_hours: 10,
        icon: 'server',
        modules: [
            'VPC subnet topology & gateway route tables',
            'IAM safety roles and permission boundaries',
            'EC2 scalability autoscaling and load balancers'
        ]
    },
    {
        slug: 'system-design',
        title: 'System Design Masterclass',
        description: 'Master large-scale system design: load balancing, microservices design patterns, distributed cache scaling, and consistency protocols.',
        difficulty: 'advanced',
        estimated_hours: 18,
        icon: 'code-2',
        modules: [
            'Layer 4 vs Layer 7 Load Balancing protocols',
            'Database sharding partitions & replica synchronizations',
            'Cache eviction strategies & distributed queues'
        ]
    }
];

async function runSeeder() {
    console.log("[Seeder] Starting Learn Module database migrations...");

    try {
        // 1. Read and apply DDL migrations
        const schemaSql = fs.readFileSync(MIGRATION_PATH, "utf8");
        await db.query(schemaSql);
        const contentSql = fs.readFileSync(CONTENT_MIGRATION_PATH, "utf8");
        await db.query(contentSql);
        const resourceSql = fs.readFileSync(RESOURCE_MIGRATION_PATH, "utf8");
        await db.query(resourceSql);
        console.log("[Seeder] Learn Module schema tables verified/created successfully.");

        // 2. Insert Tracks & Modules
        for (const track of SEED_TRACKS) {
            // Upsert Track
            const trackRes = await db.query(
                `INSERT INTO learning_tracks (slug, title, description, difficulty, estimated_hours, icon)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (slug) DO UPDATE
         SET title = EXCLUDED.title, description = EXCLUDED.description, difficulty = EXCLUDED.difficulty, estimated_hours = EXCLUDED.estimated_hours, icon = EXCLUDED.icon
         RETURNING id`,
                [track.slug, track.title, track.description, track.difficulty, track.estimated_hours, track.icon]
            );

            const trackId = trackRes.rows[0].id;
            console.log(`[Seeder] Trackupsert done: "${track.title}" (ID: ${trackId})`);

            // Upsert Modules
            // Delete old modules to avoid conflicts under name changes or reordering
            await db.query("DELETE FROM learning_modules WHERE track_id = $1", [trackId]);

            for (let i = 0; i < track.modules.length; i++) {
                const modTitle = track.modules[i];
                await db.query(
                    `INSERT INTO learning_modules (track_id, title, sort_order)
           VALUES ($1, $2, $3)`,
                    [trackId, modTitle, i + 1]
                );
            }
            console.log(`[Seeder] Seeded ${track.modules.length} modules for track "${track.title}"`);
        }

        console.log("[Seeder] Database migration and seeding successfully complete.");
    } catch (err) {
        console.error("[Seeder] Deployment error:", err);
    } finally {
        // Close connection pool
        await db.end();
        console.log("[Seeder] Connection pool finalized.");
    }
}

runSeeder();
