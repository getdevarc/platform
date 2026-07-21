const db = require("../config/db");
const asyncHandler = require("../utils/asyncHandler");
const superAdminService = require("../services/superAdminService");
const moduleContentService = require("../services/moduleContentService");

// 1. Fetch overall platform statistics with dynamic aggregates & activity timeline
exports.getStats = asyncHandler(async (req, res) => {
    // Query total users
    const usersCountRes = await db.query("SELECT COUNT(*) as count FROM users");
    const totalUsers = parseInt(usersCountRes.rows[0].count, 10);

    // Query active learning tracks count
    const activeTracksRes = await db.query(
        "SELECT COUNT(*) as count FROM learning_tracks WHERE status = 'ACTIVE'"
    );
    const activeTracks = parseInt(activeTracksRes.rows[0].count, 10);

    // Query study guides generated (stored in user_module_content)
    const studyGuidesRes = await db.query(
        "SELECT COUNT(*) as count FROM user_module_content"
    );
    const studyGuidesGenerated = parseInt(studyGuidesRes.rows[0].count, 10);

    // Query resources generated (stored in user_module_resources)
    const resourcesRes = await db.query(
        "SELECT COUNT(*) as count FROM user_module_resources"
    );
    const resourcesGenerated = parseInt(resourcesRes.rows[0].count, 10);

    // Problems solved count
    const acceptedSubmissionsRes = await db.query(
        "SELECT COUNT(DISTINCT problem_id) as count FROM submissions WHERE status = 'accepted'"
    );
    const solvedProblemsCount = parseInt(acceptedSubmissionsRes.rows[0].count, 10);

    // Completed mock interview sessions
    const interviewsCountRes = await db.query(
        "SELECT COUNT(*) as count FROM interviews WHERE status = 'completed'"
    );
    const completedInterviews = parseInt(interviewsCountRes.rows[0].count, 10);

    // Aggregate recent platform activity timeline (Limit 15)
    const activityQuery = `
        SELECT 'signup' as type, name || ' registered a new account.' as description, created_at 
        FROM users
        UNION ALL
        SELECT 'enrollment' as type, 'Enrolled in track: ' || lt.title as description, uet.enrolled_at as created_at 
        FROM user_enrolled_tracks uet 
        JOIN learning_tracks lt ON uet.track_id = lt.id
        UNION ALL
        SELECT 'submission' as type, 'Submitted solution for: ' || p.title || ' (' || s.status || ')' as description, s.created_at 
        FROM submissions s 
        JOIN problems p ON s.problem_id = p.id
        ORDER BY created_at DESC 
        LIMIT 15;
    `;
    const activityRes = await db.query(activityQuery);
    const recentActivity = activityRes.rows;

    res.json({
        success: true,
        data: {
            totalUsers,
            activeTracks,
            studyGuidesGenerated,
            resourcesGenerated,
            solvedProblemsCount,
            completedInterviews,
            recentActivity
        }
    });
});

// 2. Retrieve all users details with extended read-only specs
exports.getAllUsers = asyncHandler(async (req, res) => {
    const usersRes = await db.query(
        `SELECT id, name, email, role, target_domain, career_answers, last_login_at, created_at 
         FROM users 
         ORDER BY created_at DESC`
    );

    // Load active track enrollments
    const enrollmentsRes = await db.query(
        `SELECT uet.user_id, lt.title 
         FROM user_enrolled_tracks uet
         JOIN learning_tracks lt ON uet.track_id = lt.id
         WHERE lt.status = 'ACTIVE'`
    );

    const userTracks = {};
    enrollmentsRes.rows.forEach(e => {
        if (!userTracks[e.user_id]) userTracks[e.user_id] = [];
        userTracks[e.user_id].push(e.title);
    });

    // Fetch current learning modules (most recently accessed per user)
    const currentModulesRes = await db.query(
        `SELECT DISTINCT ON (user_id) user_id, lm.title as current_module
         FROM user_module_content umc
         JOIN learning_modules lm ON umc.module_id = lm.id
         ORDER BY user_id, umc.updated_at DESC`
    );

    const userModules = {};
    currentModulesRes.rows.forEach(m => {
        userModules[m.user_id] = m.current_module;
    });

    const superAdminEmail = superAdminService.getSuperAdminEmail();

    const users = usersRes.rows.map(u => {
        const answers = u.career_answers && typeof u.career_answers === "object" ? u.career_answers : {};
        return {
            id: u.id,
            name: u.name,
            email: u.email,
            role: u.role,
            target_domain: u.target_domain || answers.goal || "Not Specified",
            dream_company: answers.dream_company || "Not Specified",
            target_role: answers.goal || u.target_domain || "Not Specified",
            enrolledTracks: userTracks[u.id] || [],
            currentModule: userModules[u.id] || "None",
            last_login_at: u.last_login_at,
            created_at: u.created_at,
            status: "ACTIVE", // read-only standard account status
            is_superadmin: u.email.toLowerCase() === superAdminEmail.toLowerCase()
        };
    });

    res.json({
        success: true,
        data: users
    });
});

// 3. Update user role with Super Admin validator constraints
exports.updateUserRole = asyncHandler(async (req, res) => {
    const targetUserId = req.params.id;
    const { role } = req.body;

    if (!role || !["admin", "user"].includes(role)) {
        return res.status(400).json({ success: false, error: "Invalid role value. Must be 'admin' or 'user'." });
    }

    // Role assignment lock to Super Administrator only
    if (!superAdminService.isSuperAdmin(req.adminUser)) {
        return res.status(403).json({
            success: false,
            error: `Access denied. Only the Super Administrator (${superAdminService.getSuperAdminEmail()}) is authorized to demote or promote administrative accounts.`
        });
    }

    // Self-modification demotion protection
    if (req.user.userId === targetUserId) {
        return res.status(400).json({ success: false, error: "Administrators cannot modify their own role." });
    }

    // Get target role detail
    const userRes = await db.query("SELECT email, role FROM users WHERE id = $1", [targetUserId]);
    if (userRes.rows.length === 0) {
        return res.status(404).json({ success: false, error: "User not found." });
    }

    const targetUser = userRes.rows[0];

    // Cannot demote the super administrator
    if (superAdminService.isSuperAdmin(targetUser)) {
        return res.status(400).json({ success: false, error: "The primary Super Administrator account role cannot be modified." });
    }

    // Last admin protection guard
    if (targetUser.role === "admin" && role === "user") {
        const adminCountRes = await db.query("SELECT COUNT(*) as count FROM users WHERE role = 'admin'");
        const adminCount = parseInt(adminCountRes.rows[0].count, 10);
        if (adminCount <= 1) {
            return res.status(400).json({
                success: false,
                error: "Cannot demote the only remaining administrator on the platform."
            });
        }
    }

    const updatedRes = await db.query(
        "UPDATE users SET role = $1 WHERE id = $2 RETURNING id, name, email, role",
        [role, targetUserId]
    );

    res.json({
        success: true,
        data: updatedRes.rows[0]
    });
});

// 4. Learning Tracks (support sort_order/display_order metadata)
exports.getTracks = asyncHandler(async (req, res) => {
    const result = await db.query("SELECT * FROM learning_tracks ORDER BY display_order ASC, created_at DESC");
    res.json({ success: true, data: result.rows });
});

exports.createTrack = asyncHandler(async (req, res) => {
    const { slug, title, description, difficulty, estimated_hours, icon, display_order } = req.body;

    if (!slug || !title || !description) {
        return res.status(400).json({ success: false, error: "Slug, title, and description are required." });
    }

    const displayOrderValue = display_order !== undefined ? parseInt(display_order, 10) : 1;

    const result = await db.query(
        `INSERT INTO learning_tracks(slug, title, description, difficulty, estimated_hours, icon, display_order, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'ACTIVE')
         RETURNING *`,
        [slug, title, description, difficulty || 'beginner', estimated_hours || 10, icon || 'book-open', displayOrderValue]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
});

exports.updateTrack = asyncHandler(async (req, res) => {
    const trackId = req.params.id;
    const { slug, title, description, difficulty, estimated_hours, icon, display_order, status } = req.body;

    if (!slug || !title || !description) {
        return res.status(400).json({ success: false, error: "Slug, title, and description are required." });
    }

    const displayOrderValue = display_order !== undefined ? parseInt(display_order, 10) : 1;

    const result = await db.query(
        `UPDATE learning_tracks 
         SET slug = $1, title = $2, description = $3, difficulty = $4, estimated_hours = $5, icon = $6, display_order = $7, status = $8
         WHERE id = $9
         RETURNING *`,
        [slug, title, description, difficulty || 'beginner', estimated_hours || 10, icon || 'book-open', displayOrderValue, status || 'ACTIVE', trackId]
    );

    if (result.rows.length === 0) {
        return res.status(404).json({ success: false, error: "Track not found." });
    }

    res.json({ success: true, data: result.rows[0] });
});

exports.archiveTrack = asyncHandler(async (req, res) => {
    const trackId = req.params.id;

    const result = await db.query(
        "UPDATE learning_tracks SET status = 'ARCHIVED' WHERE id = $1 RETURNING *",
        [trackId]
    );

    if (result.rows.length === 0) {
        return res.status(404).json({ success: false, error: "Track not found." });
    }

    res.json({ success: true, message: "Track soft-archived successfully.", data: result.rows[0] });
});

exports.restoreTrack = asyncHandler(async (req, res) => {
    const trackId = req.params.id;

    const result = await db.query(
        "UPDATE learning_tracks SET status = 'ACTIVE' WHERE id = $1 RETURNING *",
        [trackId]
    );

    if (result.rows.length === 0) {
        return res.status(404).json({ success: false, error: "Track not found." });
    }

    res.json({ success: true, message: "Track restored successfully.", data: result.rows[0] });
});

// 5. Learning Modules Management under Tracks
exports.getTrackModules = asyncHandler(async (req, res) => {
    const { trackId } = req.params;
    const result = await db.query(
        "SELECT * FROM learning_modules WHERE track_id = $1 ORDER BY sort_order ASC",
        [trackId]
    );
    res.json({ success: true, data: result.rows });
});

exports.createModule = asyncHandler(async (req, res) => {
    const { trackId } = req.params;
    const { title, sort_order } = req.body;

    if (!title) {
        return res.status(400).json({ success: false, error: "Module title is required." });
    }

    const orderValue = sort_order !== undefined ? parseInt(sort_order, 10) : 1;

    const result = await db.query(
        `INSERT INTO learning_modules(track_id, title, sort_order)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [trackId, title, orderValue]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
});

exports.updateModule = asyncHandler(async (req, res) => {
    const moduleId = req.params.id;
    const { title, sort_order } = req.body;

    if (!title || sort_order === undefined) {
        return res.status(400).json({ success: false, error: "Title and sort order are required." });
    }

    const result = await db.query(
        `UPDATE learning_modules
         SET title = $1, sort_order = $2
         WHERE id = $3
         RETURNING *`,
        [title, parseInt(sort_order, 10), moduleId]
    );

    if (result.rows.length === 0) {
        return res.status(404).json({ success: false, error: "Module not found." });
    }

    res.json({ success: true, data: result.rows[0] });
});

exports.deleteModule = asyncHandler(async (req, res) => {
    const moduleId = req.params.id;

    const result = await db.query(
        "DELETE FROM learning_modules WHERE id = $1 RETURNING *",
        [moduleId]
    );

    if (result.rows.length === 0) {
        return res.status(404).json({ success: false, error: "Module not found." });
    }

    res.json({ success: true, message: "Module deleted successfully." });
});

// 6. Curated Resources Management (Flexible curation support)
exports.getResources = asyncHandler(async (req, res) => {
    const result = await db.query(
        `SELECT r.*,
           COALESCE(
             json_agg(
               json_build_object(
                 'associationId', a.id, 
                 'type', a.associated_type, 
                 'id', a.associated_id
               )
             ) FILTER (WHERE a.id IS NOT NULL),
             '[]'::json
           ) as associations
         FROM curated_resources r
         LEFT JOIN curated_resource_associations a ON r.id = a.resource_id
         GROUP BY r.id
         ORDER BY r.created_at DESC`
    );

    res.json({ success: true, data: result.rows });
});

// Page-scoped Curated Resources CRUD
exports.getPageResourcesAdmin = asyncHandler(async (req, res) => {
    const { pageId } = req.params;

    if (!pageId) {
        return res.status(400).json({ success: false, error: "pageId parameter is required" });
    }

    const result = await db.query(
        `SELECT r.id, r.title, r.url, r.source, r.reason, r.tags, r.metadata, r.category, r.provider, r.difficulty, r.is_official, r.type, r.status, r.display_order, r.description,
                cra.id as association_id
         FROM curated_resources r
         JOIN curated_resource_associations cra ON r.id = cra.resource_id
         WHERE cra.associated_type = 'page' AND cra.associated_id = $1
         ORDER BY r.display_order ASC, r.created_at DESC`,
        [pageId]
    );

    res.json({ success: true, data: result.rows });
});

exports.createPageResource = asyncHandler(async (req, res) => {
    const { pageId } = req.params;
    const { title, url, source, reason, tags, metadata, category, provider, difficulty, is_official, type, status, display_order, description } = req.body;

    if (!pageId) {
        return res.status(400).json({ success: false, error: "pageId parameter is required" });
    }

    // Double check URL duplicate on the same page
    const duplicateCheck = await db.query(
        `SELECT COUNT(*) FROM curated_resources r
         JOIN curated_resource_associations cra ON r.id = cra.resource_id
         WHERE cra.associated_type = 'page' AND cra.associated_id = $1 AND r.url = $2`,
        [pageId, url]
    );
    if (parseInt(duplicateCheck.rows[0].count, 10) > 0) {
        return res.status(400).json({ success: false, error: "Duplicate URL: A resource with this URL is already linked to this learning page." });
    }

    const tagsArray = Array.isArray(tags) ? tags : [];
    const metadataObj = metadata && typeof metadata === "object" ? metadata : {};
    const officialFlag = is_official === true || is_official === "true";

    await db.query("BEGIN");
    try {
        const resourceResult = await db.query(
            `INSERT INTO curated_resources (title, url, source, reason, tags, metadata, category, provider, difficulty, is_official, type, status, display_order, description)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
             RETURNING *`,
            [
                title,
                url,
                source || provider || "External",
                reason || "",
                tagsArray,
                JSON.stringify(metadataObj),
                category || "General",
                provider || "External",
                difficulty || "beginner",
                officialFlag,
                type,
                status || "PUBLISHED",
                display_order !== undefined ? parseInt(display_order, 10) : 1,
                description || ""
            ]
        );

        const newResource = resourceResult.rows[0];

        await db.query(
            `INSERT INTO curated_resource_associations (resource_id, associated_type, associated_id)
             VALUES ($1, 'page', $2)`,
            [newResource.id, pageId]
        );

        await db.query("COMMIT");

        // Broadcast change
        const socketService = require("../services/socketService");
        socketService.emitCMSUpdate("resources", pageId, { action: "create", resourceId: newResource.id });

        res.status(201).json({ success: true, data: newResource });
    } catch (error) {
        await db.query("ROLLBACK");
        throw error;
    }
});

exports.updatePageResource = asyncHandler(async (req, res) => {
    const resourceId = req.params.id;
    const { title, url, source, reason, tags, metadata, category, provider, difficulty, is_official, type, status, display_order, description } = req.body;

    const checkResource = await db.query(`SELECT id FROM curated_resources WHERE id = $1`, [resourceId]);
    if (checkResource.rows.length === 0) {
        return res.status(404).json({ success: false, error: "Curated resource not found." });
    }

    const assocRes = await db.query(
        `SELECT associated_id FROM curated_resource_associations WHERE resource_id = $1 AND associated_type = 'page' LIMIT 1`,
        [resourceId]
    );
    const pageId = assocRes.rows.length > 0 ? assocRes.rows[0].associated_id : null;

    if (pageId) {
        const duplicateCheck = await db.query(
            `SELECT COUNT(*) FROM curated_resources r
             JOIN curated_resource_associations cra ON r.id = cra.resource_id
             WHERE cra.associated_type = 'page' AND cra.associated_id = $1 AND r.url = $2 AND r.id != $3`,
            [pageId, url, resourceId]
        );
        if (parseInt(duplicateCheck.rows[0].count, 10) > 0) {
            return res.status(400).json({ success: false, error: "Duplicate URL: A resource with this URL is already linked to this learning page." });
        }
    }

    const tagsArray = Array.isArray(tags) ? tags : [];
    const metadataObj = metadata && typeof metadata === "object" ? metadata : {};
    const officialFlag = is_official === true || is_official === "true";

    const result = await db.query(
        `UPDATE curated_resources
         SET title = $1, url = $2, source = $3, reason = $4, tags = $5, metadata = $6, category = $7, provider = $8, difficulty = $9, is_official = $10, type = $11, status = $12, display_order = $13, description = $14
         WHERE id = $15
         RETURNING *`,
        [
            title,
            url,
            source || provider || "External",
            reason || "",
            tagsArray,
            JSON.stringify(metadataObj),
            category || "General",
            provider || "External",
            difficulty || "beginner",
            officialFlag,
            type,
            status || "PUBLISHED",
            display_order !== undefined ? parseInt(display_order, 10) : 1,
            description || "",
            resourceId
        ]
    );

    const updatedResource = result.rows[0];

    if (pageId) {
        const socketService = require("../services/socketService");
        socketService.emitCMSUpdate("resources", pageId, { action: "update", resourceId });
    }

    res.json({ success: true, data: updatedResource });
});

exports.deletePageResource = asyncHandler(async (req, res) => {
    const resourceId = req.params.id;

    const assocRes = await db.query(
        `SELECT associated_id FROM curated_resource_associations WHERE resource_id = $1 AND associated_type = 'page' LIMIT 1`,
        [resourceId]
    );
    const pageId = assocRes.rows.length > 0 ? assocRes.rows[0].associated_id : null;

    const result = await db.query(
        "DELETE FROM curated_resources WHERE id = $1 RETURNING *",
        [resourceId]
    );

    if (result.rows.length === 0) {
        return res.status(404).json({ success: false, error: "Curated resource not found." });
    }

    if (pageId) {
        const socketService = require("../services/socketService");
        socketService.emitCMSUpdate("resources", pageId, { action: "delete", resourceId });
    }

    res.json({ success: true, message: "Curated resource deleted successfully." });
});

exports.reorderPageResources = asyncHandler(async (req, res) => {
    const { pageId } = req.params;
    const { orders } = req.body;

    if (!pageId) {
        return res.status(400).json({ success: false, error: "pageId parameter is required" });
    }

    if (!orders || !Array.isArray(orders)) {
        return res.status(400).json({ success: false, error: "orders list array is required" });
    }

    await db.query("BEGIN");
    try {
        for (const orderItem of orders) {
            await db.query(
                `UPDATE curated_resources
                 SET display_order = $1
                 WHERE id = $2`,
                [orderItem.display_order, orderItem.id]
            );
        }
        await db.query("COMMIT");

        const socketService = require("../services/socketService");
        socketService.emitCMSUpdate("resources", pageId, { action: "reorder" });

        res.json({ success: true, message: "Page resources reordered successfully." });
    } catch (error) {
        await db.query("ROLLBACK");
        throw error;
    }
});

// Polymorphic mapping associations
exports.createAssociation = asyncHandler(async (req, res) => {
    const resourceId = req.params.id;
    const { associated_type, associated_id } = req.body;

    if (!associated_type) {
        return res.status(400).json({ success: false, error: "Associated type is required." });
    }

    if (!["track", "module", "page", "global"].includes(associated_type)) {
        return res.status(400).json({ success: false, error: "Invalid association type. Must be 'track', 'module', 'page', or 'global'." });
    }

    if (associated_type !== "global" && !associated_id) {
        return res.status(400).json({ success: false, error: "Associated ID is required for non-global types." });
    }

    // Check if mapping target exists in system
    if (associated_type !== "global") {
        let table = "";
        if (associated_type === "track") table = "learning_tracks";
        else if (associated_type === "module") table = "learning_modules";
        else if (associated_type === "page") table = "module_pages";

        const checkRes = await db.query(`SELECT id FROM ${table} WHERE id = $1`, [associated_id]);
        if (checkRes.rows.length === 0) {
            return res.status(404).json({ success: false, error: `Association target ${associated_type} not found.` });
        }
    }

    const targetId = associated_type === "global" ? '00000000-0000-0000-0000-000000000000' : associated_id;

    const result = await db.query(
        `INSERT INTO curated_resource_associations (resource_id, associated_type, associated_id)
         VALUES ($1, $2, $3)
         ON CONFLICT (resource_id, associated_type, associated_id) DO NOTHING
         RETURNING *`,
        [resourceId, associated_type, targetId]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
});

exports.deleteAssociation = asyncHandler(async (req, res) => {
    const { associationId } = req.params;

    const result = await db.query(
        "DELETE FROM curated_resource_associations WHERE id = $1 RETURNING *",
        [associationId]
    );

    if (result.rows.length === 0) {
        return res.status(404).json({ success: false, error: "Association mapping not found." });
    }

    res.json({ success: true, message: "Association mapping deleted successfully." });
});

// 7. Platform Settings API with Auditing Metadata
exports.getSettings = asyncHandler(async (req, res) => {
    const result = await db.query(
        `SELECT ps.key, ps.value, ps.description, ps.updated_at, u.name as updated_by_name
         FROM platform_settings ps
         LEFT JOIN users u ON ps.updated_by = u.id
         ORDER BY ps.key ASC`
    );
    res.json({ success: true, data: result.rows });
});

exports.updateSetting = asyncHandler(async (req, res) => {
    const { key } = req.params;
    const { value, description } = req.body;

    if (value === undefined) {
        return res.status(400).json({ success: false, error: "Setting value is required." });
    }

    // We fetch the existing description if none is passed in
    let finalDescription = description;
    if (description === undefined) {
        const existRes = await db.query("SELECT description FROM platform_settings WHERE key = $1", [key]);
        if (existRes.rows.length > 0) {
            finalDescription = existRes.rows[0].description;
        }
    }

    const result = await db.query(
        `UPDATE platform_settings
         SET value = $1, description = $2, updated_by = $3, updated_at = NOW()
         WHERE key = $4
         RETURNING *`,
        [JSON.stringify(value), finalDescription || "", req.adminUser.id, key]
    );

    if (result.rows.length === 0) {
        return res.status(404).json({ success: false, error: "Platform setting not found." });
    }

    res.json({ success: true, data: result.rows[0] });
});

// 8. Learning Pages CMS Management
exports.getModulePages = asyncHandler(async (req, res) => {
    const { moduleId } = req.params;
    const result = await db.query(
        `SELECT p.*, u.name as updated_by_name
         FROM module_pages p
         LEFT JOIN users u ON p.updated_by = u.id
         WHERE p.module_id = $1
         ORDER BY p.display_order ASC, p.created_at ASC`,
        [moduleId]
    );
    res.json({ success: true, data: result.rows });
});

exports.createModulePage = asyncHandler(async (req, res) => {
    const { moduleId } = req.params;
    const { title, slug } = req.body;

    if (!title || !slug) {
        return res.status(400).json({ success: false, error: "Title and slug are required." });
    }

    // Verify module exists
    const modCheck = await db.query("SELECT id FROM learning_modules WHERE id = $1", [moduleId]);
    if (modCheck.rows.length === 0) {
        return res.status(404).json({ success: false, error: "Learning module not found." });
    }

    const orderRes = await db.query(
        "SELECT COALESCE(MAX(display_order), 0) as max_order FROM module_pages WHERE module_id = $1",
        [moduleId]
    );
    const displayOrder = parseInt(orderRes.rows[0].max_order, 10) + 1;

    const result = await db.query(
        `INSERT INTO module_pages (module_id, title, slug, display_order, status, updated_by)
         VALUES ($1, $2, $3, $4, 'DRAFT', $5)
         RETURNING *`,
        [moduleId, title, slug, displayOrder, req.adminUser.id]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
});

exports.updateModulePage = asyncHandler(async (req, res) => {
    const pageId = req.params.id;
    const {
        title, slug, status, display_order, difficulty, estimated_minutes,
        learning_objectives, code_snippets, best_practices, common_mistakes,
        real_world_examples, summary, prerequisites, previous_page_id, next_page_id
    } = req.body;

    if (!title || !slug || !status || display_order === undefined || !difficulty) {
        return res.status(400).json({ success: false, error: "Missing required fields." });
    }

    if (previous_page_id === pageId || next_page_id === pageId) {
        return res.status(400).json({ success: false, error: "A page cannot reference itself." });
    }

    const result = await db.query(
        `UPDATE module_pages
         SET title = $1, slug = $2, status = $3, display_order = $4, difficulty = $5,
             estimated_minutes = $6, learning_objectives = $7, code_snippets = $8,
             best_practices = $9, common_mistakes = $10, real_world_examples = $11,
             summary = $12, prerequisites = $13, previous_page_id = $14, next_page_id = $15,
             updated_by = $16, updated_at = NOW()
         WHERE id = $17
         RETURNING *`,
        [
            title, slug, status, parseInt(display_order, 10), difficulty,
            parseInt(estimated_minutes, 10) || 10, learning_objectives || "", code_snippets || "",
            best_practices || "", common_mistakes || "", real_world_examples || "",
            summary || "", prerequisites || "", previous_page_id || null, next_page_id || null,
            req.adminUser.id, pageId
        ]
    );

    if (result.rows.length === 0) {
        return res.status(404).json({ success: false, error: "Learning page not found." });
    }

    res.json({ success: true, data: result.rows[0] });
});

exports.deleteModulePage = asyncHandler(async (req, res) => {
    const pageId = req.params.id;
    const result = await db.query("DELETE FROM module_pages WHERE id = $1 RETURNING *", [pageId]);

    if (result.rows.length === 0) {
        return res.status(404).json({ success: false, error: "Learning page not found." });
    }

    res.json({ success: true, message: "Page deleted successfully." });
});

exports.reorderPages = asyncHandler(async (req, res) => {
    const { orders } = req.body;
    if (!Array.isArray(orders)) {
        return res.status(400).json({ success: false, error: "Orders array is required." });
    }

    for (const o of orders) {
        await db.query("UPDATE module_pages SET display_order = $1 WHERE id = $2", [parseInt(o.display_order, 10), o.id]);
    }

    res.json({ success: true, message: "Pages reordered successfully." });
});

exports.reorderModules = asyncHandler(async (req, res) => {
    const { orders } = req.body;
    if (!Array.isArray(orders)) {
        return res.status(400).json({ success: false, error: "Orders array is required." });
    }

    for (const o of orders) {
        await db.query("UPDATE learning_modules SET sort_order = $1 WHERE id = $2", [parseInt(o.sort_order, 10), o.id]);
    }

    res.json({ success: true, message: "Modules reordered successfully." });
});

exports.generatePageDraft = asyncHandler(async (req, res) => {
    const pageId = req.params.id;

    // Load active page module context details
    const pRes = await db.query(
        `SELECT p.title as page_title, m.title as module_title, t.title as track_title
         FROM module_pages p
         JOIN learning_modules m ON p.module_id = m.id
         JOIN learning_tracks t ON m.track_id = t.id
         WHERE p.id = $1`,
        [pageId]
    );

    if (pRes.rows.length === 0) {
        return res.status(404).json({ success: false, error: "Learning page not found." });
    }

    const { page_title, module_title, track_title } = pRes.rows[0];

    const draft = await moduleContentService.generateCMSPageDraft(
        req.user.userId,
        track_title,
        module_title,
        page_title
    );

    res.json({ success: true, data: draft });
});

