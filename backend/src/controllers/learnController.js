const learnRepository = require("../repositories/learnRepository");
const moduleContentRepository = require("../repositories/moduleContentRepository");
const moduleContentService = require("../services/moduleContentService");
const moduleResourceRepository = require("../repositories/moduleResourceRepository");
const moduleResourceService = require("../services/moduleResourceService");
const asyncHandler = require("../utils/asyncHandler");
const db = require("../config/db");
const cache = require("../utils/cache");

// Retrieve all tracks with enrollment info for current user
exports.getTracks = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const cacheKey = `learn:tracks:${userId}`;

    const cachedTracks = await cache.get(cacheKey);
    if (cachedTracks) {
        return res.json({
            success: true,
            data: cachedTracks,
            error: null
        });
    }

    const tracks = await learnRepository.getAllTracks(userId);

    await cache.set(cacheKey, tracks, 600, [`user:${userId}`]);

    res.json({
        success: true,
        data: tracks,
        error: null
    });
});

// Retrieve single track detail and corresponding modules list
exports.getTrackDetail = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { trackId } = req.params;
    const cacheKey = `learn:track:${trackId}:${userId}`;

    const cachedTrack = await cache.get(cacheKey);
    if (cachedTrack) {
        return res.json({
            success: true,
            data: cachedTrack,
            error: null
        });
    }

    const track = await learnRepository.getTrackById(userId, trackId);
    if (!track) {
        return res.status(404).json({
            success: false,
            data: null,
            error: "Learning track not found"
        });
    }

    await cache.set(cacheKey, track, 600, [`user:${userId}`]);

    res.json({
        success: true,
        data: track,
        error: null
    });
});

// Enroll current user in learning track
exports.enrollTrack = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { trackId } = req.body;

    if (!trackId) {
        return res.status(400).json({
            success: false,
            data: null,
            error: "trackId parameter is required"
        });
    }

    try {
        const enrollment = await learnRepository.enrollInTrack(userId, trackId);

        // Invalidate dashboard stats and tracks cache for this user
        await cache.invalidateByTag(`user:${userId}`);

        res.json({
            success: true,
            data: enrollment,
            error: null
        });
    } catch (err) {
        res.status(404).json({
            success: false,
            data: null,
            error: err.message || "Failed to enroll in track"
        });
    }
});

// Lazy-generate or retrieve stored module content
exports.getModuleContent = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { moduleId } = req.params;

    if (!moduleId) {
        return res.status(400).json({
            success: false,
            data: null,
            error: "moduleId parameter is required"
        });
    }

    // 1. Check if content is already persisted in the database
    let moduleContentRecord = await moduleContentRepository.getModuleContent(userId, moduleId);

    if (moduleContentRecord) {
        return res.json({
            success: true,
            data: {
                content: moduleContentRecord.content,
                updated_at: moduleContentRecord.updated_at
            },
            error: null
        });
    }

    // 2. Fetch track title and module title for AI context
    const moduleMeta = await db.query(
        `SELECT lm.title AS module_title, lt.title AS track_title
         FROM learning_modules lm
         JOIN learning_tracks lt ON lm.track_id = lt.id
         WHERE lm.id = $1`,
        [moduleId]
    );

    if (moduleMeta.rows.length === 0) {
        return res.status(404).json({
            success: false,
            data: null,
            error: "Learning module not found"
        });
    }

    const { module_title, track_title } = moduleMeta.rows[0];

    // 3. Lazy Generation: Call Groq service
    const generatedMarkdown = await moduleContentService.generateModuleContent(userId, track_title, module_title);

    // 4. Save to database
    moduleContentRecord = await moduleContentRepository.upsertModuleContent(userId, moduleId, generatedMarkdown);

    res.json({
        success: true,
        data: {
            content: moduleContentRecord.content,
            updated_at: moduleContentRecord.updated_at
        },
        error: null
    });
});

// Explicitly regenerate and overwrite stored module content
exports.regenerateModuleContent = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { moduleId } = req.params;

    if (!moduleId) {
        return res.status(400).json({
            success: false,
            data: null,
            error: "moduleId parameter is required"
        });
    }

    // 1. Fetch track title and module title for AI context
    const moduleMeta = await db.query(
        `SELECT lm.title AS module_title, lt.title AS track_title
         FROM learning_modules lm
         JOIN learning_tracks lt ON lm.track_id = lt.id
         WHERE lm.id = $1`,
        [moduleId]
    );

    if (moduleMeta.rows.length === 0) {
        return res.status(404).json({
            success: false,
            data: null,
            error: "Learning module not found"
        });
    }

    const { module_title, track_title } = moduleMeta.rows[0];

    // 2. Force Generation: Call Groq service
    const generatedMarkdown = await moduleContentService.generateModuleContent(userId, track_title, module_title);

    // 3. Save to database (Upsert)
    const moduleContentRecord = await moduleContentRepository.upsertModuleContent(userId, moduleId, generatedMarkdown);

    res.json({
        success: true,
        data: {
            content: moduleContentRecord.content,
            updated_at: moduleContentRecord.updated_at
        },
        error: null
    });
});

// Lazy-generate or retrieve stored module resources (with module -> track fallback priority)
exports.getModuleResources = asyncHandler(async (req, res) => {
    const { moduleId } = req.params;

    if (!moduleId) {
        return res.status(400).json({
            success: false,
            data: null,
            error: "moduleId parameter is required"
        });
    }

    // 1. Try Module-Specific Resources
    let resourcesRes = await db.query(
        `SELECT r.id, r.title, r.url, r.source AS source_name, r.reason,
                COALESCE(r.tags[1], 'General') AS category,
                COALESCE(r.metadata->>'difficulty', 'beginner') AS difficulty,
                (COALESCE(r.metadata->>'is_official', 'false'))::boolean AS is_official
         FROM curated_resources r
         JOIN curated_resource_associations cra ON r.id = cra.resource_id
         WHERE cra.associated_type = 'module' AND cra.associated_id = $1`,
        [moduleId]
    );

    // 2. Fallback to Track-Specific Resources
    if (resourcesRes.rows.length === 0) {
        const moduleMeta = await db.query(
            `SELECT track_id FROM learning_modules WHERE id = $1`,
            [moduleId]
        );
        if (moduleMeta.rows.length > 0) {
            const trackId = moduleMeta.rows[0].track_id;
            resourcesRes = await db.query(
                `SELECT r.id, r.title, r.url, r.source AS source_name, r.reason,
                        COALESCE(r.tags[1], 'General') AS category,
                        COALESCE(r.metadata->>'difficulty', 'beginner') AS difficulty,
                        (COALESCE(r.metadata->>'is_official', 'false'))::boolean AS is_official
                 FROM curated_resources r
                 JOIN curated_resource_associations cra ON r.id = cra.resource_id
                 WHERE cra.associated_type = 'track' AND cra.associated_id = $1`,
                [trackId]
            );
        }
    }

    res.json({
        success: true,
        data: {
            resources: resourcesRes.rows,
            updated_at: new Date()
        },
        error: null
    });
});

// Explicitly regenerate and overwrite stored module resources
exports.regenerateModuleResources = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { moduleId } = req.params;

    if (!moduleId) {
        return res.status(400).json({
            success: false,
            data: null,
            error: "moduleId parameter is required"
        });
    }

    // 1. Fetch track title and module title for AI context
    const moduleMeta = await db.query(
        `SELECT lm.title AS module_title, lt.title AS track_title
         FROM learning_modules lm
         JOIN learning_tracks lt ON lm.track_id = lt.id
         WHERE lm.id = $1`,
        [moduleId]
    );

    if (moduleMeta.rows.length === 0) {
        return res.status(404).json({
            success: false,
            data: null,
            error: "Learning module not found"
        });
    }

    const { module_title, track_title } = moduleMeta.rows[0];

    // 2. Force Generation: Call Groq service
    let generatedJSON = [];
    try {
        generatedJSON = await moduleResourceService.generateModuleResources(userId, track_title, module_title);
    } catch (aiErr) {
        console.error("AI Resource regeneration failed, falling back to empty list:", aiErr);
    }

    // 3. Save to database (Upsert)
    const resourceRecord = await moduleResourceRepository.upsertModuleResources(userId, moduleId, generatedJSON);

    res.json({
        success: true,
        data: {
            resources: resourceRecord.resources,
            updated_at: resourceRecord.updated_at
        },
        error: null
    });
});

const pageRepository = require("../repositories/pageRepository");

// Retrieve all pages for a given learning module
exports.getModulePages = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { moduleId } = req.params;
    if (!moduleId) {
        return res.status(400).json({ success: false, error: "moduleId parameter is required" });
    }
    const pages = await pageRepository.getPagesByModuleId(moduleId, userId);
    res.json({
        success: true,
        data: pages,
        error: null
    });
});

// Lazy-generate or retrieve page study guide content
exports.getPageContent = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { pageId } = req.params;

    if (!pageId) {
        return res.status(400).json({ success: false, error: "pageId parameter is required" });
    }

    const page = await pageRepository.getPageById(pageId);
    if (!page) {
        return res.status(404).json({ success: false, error: "Learning page not found" });
    }

    // If content is already present, return it
    if (page.content && page.content.trim() !== "") {
        return res.json({
            success: true,
            data: {
                content: page.content,
                updated_at: page.updated_at
            },
            error: null
        });
    }

    // Fallback: Lazy Generation using AI
    // Fetch module and track title metadata
    const metaRes = await db.query(
        `SELECT lm.title AS module_title, lt.title AS track_title
         FROM learning_modules lm
         JOIN learning_tracks lt ON lm.track_id = lt.id
         WHERE lm.id = $1`,
        [page.module_id]
    );

    if (metaRes.rows.length === 0) {
        return res.status(404).json({ success: false, error: "Parent module not found" });
    }

    const { module_title, track_title } = metaRes.rows[0];

    const generatedMarkdown = await moduleContentService.generatePageContent(
        userId,
        track_title,
        module_title,
        page.title
    );

    const updatedPage = await pageRepository.updatePageContent(pageId, generatedMarkdown);

    res.json({
        success: true,
        data: {
            content: updatedPage.content,
            updated_at: updatedPage.updated_at
        },
        error: null
    });
});

// Regenerate page study guide content (RESTRICTED to admin users in routes)
exports.regeneratePageContent = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { pageId } = req.params;

    if (!pageId) {
        return res.status(400).json({ success: false, error: "pageId parameter is required" });
    }

    const page = await pageRepository.getPageById(pageId);
    if (!page) {
        return res.status(404).json({ success: false, error: "Learning page not found" });
    }

    const metaRes = await db.query(
        `SELECT lm.title AS module_title, lt.title AS track_title
         FROM learning_modules lm
         JOIN learning_tracks lt ON lm.track_id = lt.id
         WHERE lm.id = $1`,
        [page.module_id]
    );

    if (metaRes.rows.length === 0) {
        return res.status(404).json({ success: false, error: "Parent module not found" });
    }

    const { module_title, track_title } = metaRes.rows[0];

    const generatedMarkdown = await moduleContentService.generatePageContent(
        userId,
        track_title,
        module_title,
        page.title
    );

    const updatedPage = await pageRepository.updatePageContent(pageId, generatedMarkdown);

    res.json({
        success: true,
        data: {
            content: updatedPage.content,
            updated_at: updatedPage.updated_at
        },
        error: null
    });
});

// Fetch normalized page resources (with page -> module -> track fallback priority)
exports.getPageResources = asyncHandler(async (req, res) => {
    const { pageId } = req.params;

    if (!pageId) {
        return res.status(400).json({ success: false, error: "pageId parameter is required" });
    }

    const page = await pageRepository.getPageById(pageId);
    if (!page) {
        return res.status(404).json({ success: false, error: "Learning page not found" });
    }

    // 1. Try Page-Specific Resources
    let resourcesRes = await db.query(
        `SELECT r.id, r.title, r.url, r.source AS source_name, r.reason, r.type, r.provider, r.status, r.display_order, r.description,
                COALESCE(r.tags[1], 'General') AS category,
                COALESCE(r.metadata->>'difficulty', 'beginner') AS difficulty,
                (COALESCE(r.metadata->>'is_official', 'false'))::boolean AS is_official
         FROM curated_resources r
         JOIN curated_resource_associations cra ON r.id = cra.resource_id
         WHERE cra.associated_type = 'page' AND cra.associated_id = $1 AND r.status = 'PUBLISHED'
         ORDER BY r.display_order ASC, r.created_at DESC`,
        [pageId]
    );

    // 2. Fallback to Module-Specific Resources
    if (resourcesRes.rows.length === 0) {
        resourcesRes = await db.query(
            `SELECT r.id, r.title, r.url, r.source AS source_name, r.reason, r.type, r.provider, r.status, r.display_order, r.description,
                    COALESCE(r.tags[1], 'General') AS category,
                    COALESCE(r.metadata->>'difficulty', 'beginner') AS difficulty,
                    (COALESCE(r.metadata->>'is_official', 'false'))::boolean AS is_official
             FROM curated_resources r
             JOIN curated_resource_associations cra ON r.id = cra.resource_id
             WHERE cra.associated_type = 'module' AND cra.associated_id = $1 AND r.status = 'PUBLISHED'
             ORDER BY r.display_order ASC, r.created_at DESC`,
            [page.module_id]
        );
    }

    // 3. Fallback to Track-Specific Resources
    if (resourcesRes.rows.length === 0) {
        const moduleMeta = await db.query(
            `SELECT track_id FROM learning_modules WHERE id = $1`,
            [page.module_id]
        );
        if (moduleMeta.rows.length > 0) {
            const trackId = moduleMeta.rows[0].track_id;
            resourcesRes = await db.query(
                `SELECT r.id, r.title, r.url, r.source AS source_name, r.reason, r.type, r.provider, r.status, r.display_order, r.description,
                        COALESCE(r.tags[1], 'General') AS category,
                        COALESCE(r.metadata->>'difficulty', 'beginner') AS difficulty,
                        (COALESCE(r.metadata->>'is_official', 'false'))::boolean AS is_official
                 FROM curated_resources r
                 JOIN curated_resource_associations cra ON r.id = cra.resource_id
                 WHERE cra.associated_type = 'track' AND cra.associated_id = $1 AND r.status = 'PUBLISHED'
                 ORDER BY r.display_order ASC, r.created_at DESC`,
                [trackId]
            );
        }
    }

    // 4. Fallback to Global Curation Resources
    if (resourcesRes.rows.length === 0) {
        resourcesRes = await db.query(
            `SELECT r.id, r.title, r.url, r.source AS source_name, r.reason, r.type, r.provider, r.status, r.display_order, r.description,
                    COALESCE(r.tags[1], 'General') AS category,
                    COALESCE(r.metadata->>'difficulty', 'beginner') AS difficulty,
                    (COALESCE(r.metadata->>'is_official', 'false'))::boolean AS is_official
             FROM curated_resources r
             JOIN curated_resource_associations cra ON r.id = cra.resource_id
             WHERE cra.associated_type = 'global' AND r.status = 'PUBLISHED'
             ORDER BY r.display_order ASC, r.created_at DESC`,
            []
        );
    }

    res.json({
        success: true,
        data: {
            resources: resourcesRes.rows,
            updated_at: new Date().toISOString()
        }
    });
});

// Regenerate page resources (RESTRICTED to admin users in routes)
exports.regeneratePageResources = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { pageId } = req.params;

    if (!pageId) {
        return res.status(400).json({ success: false, error: "pageId parameter is required" });
    }

    const page = await pageRepository.getPageById(pageId);
    if (!page) {
        return res.status(404).json({ success: false, error: "Learning page not found" });
    }

    // Delete existing resource associations for this page
    await db.query(
        `DELETE FROM curated_resource_associations
         WHERE associated_type = 'page' AND associated_id = $1`,
        [pageId]
    );

    // Fetch meta details for AI prompt
    const metaRes = await db.query(
        `SELECT lm.title AS module_title, lt.title AS track_title
         FROM learning_modules lm
         JOIN learning_tracks lt ON lm.track_id = lt.id
         WHERE lm.id = $1`,
        [page.module_id]
    );

    if (metaRes.rows.length === 0) {
        return res.status(404).json({ success: false, error: "Parent module not found" });
    }

    const { module_title, track_title } = metaRes.rows[0];

    let generatedJSON = [];
    try {
        generatedJSON = await moduleResourceService.generatePageResources(
            userId,
            track_title,
            module_title,
            page.title
        );
    } catch (aiErr) {
        console.error("AI Page Resource regeneration failed, falling back to empty list:", aiErr);
    }

    // Save regenerated resources
    if (generatedJSON && generatedJSON.length > 0) {
        for (const item of generatedJSON) {
            const url = item.url || null;
            const title = item.title || "External Resource";
            const source = item.source_name || item.provider || "External";
            const reason = item.reason || "";
            const tags = item.category ? [item.category] : ["General"];
            const metadata = {
                difficulty: item.difficulty || "beginner",
                is_official: !!item.is_official
            };

            const insertedRes = await db.query(
                `INSERT INTO curated_resources (title, url, source, reason, tags, metadata)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 RETURNING id`,
                [title, url || "", source, reason, tags, JSON.stringify(metadata)]
            );

            const resourceId = insertedRes.rows[0].id;

            await db.query(
                `INSERT INTO curated_resource_associations (resource_id, associated_type, associated_id)
                 VALUES ($1, 'page', $2)
                 ON CONFLICT DO NOTHING`,
                [resourceId, pageId]
            );
        }
    }

    const finalResources = await db.query(
        `SELECT r.id, r.title, r.url, r.source AS source_name, r.reason,
                COALESCE(r.tags[1], 'General') AS category,
                COALESCE(r.metadata->>'difficulty', 'beginner') AS difficulty,
                (COALESCE(r.metadata->>'is_official', 'false'))::boolean AS is_official
         FROM curated_resources r
         JOIN curated_resource_associations cra ON r.id = cra.resource_id
         WHERE cra.associated_type = 'page' AND cra.associated_id = $1`,
        [pageId]
    );

    res.json({
        success: true,
        data: {
            resources: finalResources.rows,
            updated_at: page.updated_at
        },
        error: null
    });
});

// Get user progress on learning page
exports.getPageProgress = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { pageId } = req.params;

    if (!pageId) {
        return res.status(400).json({ success: false, error: "pageId parameter is required" });
    }

    const progress = await pageRepository.getUserPageProgress(userId, pageId);

    res.json({
        success: true,
        data: progress || {
            is_completed: false,
            is_bookmarked: false,
            notes: null
        },
        error: null
    });
});

// Update page progress details (PATCH)
exports.patchPageProgress = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { pageId } = req.params;
    const { is_completed, is_bookmarked, notes } = req.body;

    if (!pageId) {
        return res.status(400).json({ success: false, error: "pageId parameter is required" });
    }

    const updatedProgress = await pageRepository.upsertUserPageProgress(userId, pageId, {
        is_completed,
        is_bookmarked,
        notes
    });

    // Invalidate dashboard stats and tracks cache for this user
    await cache.invalidateByTag(`user:${userId}`);

    res.json({
        success: true,
        data: updatedProgress,
        error: null
    });
});

// Update track learning session (PATCH)
exports.patchTrackSession = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { trackId } = req.params;
    const { pageId } = req.body;

    if (!pageId) {
        return res.status(400).json({ success: false, error: "pageId parameter is required in request body" });
    }

    const session = await learnRepository.updateLastVisitedPage(userId, trackId, pageId);
    if (!session) {
        return res.status(404).json({ success: false, error: "Track enrollment not found" });
    }

    // Invalidate dashboard stats and tracks cache for this user
    await cache.invalidateByTag(`user:${userId}`);

    res.json({
        success: true,
        data: session,
        error: null
    });
});


