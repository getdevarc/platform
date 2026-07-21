const db = require("../config/db");

// Retrieve all pages for a given module (including user completion progress)
exports.getPagesByModuleId = async (moduleId, userId) => {
    const result = await db.query(
        `SELECT p.id, p.module_id, p.title, p.slug, p.display_order, p.estimated_minutes, p.status, p.created_at, p.updated_at,
                COALESCE(upp.is_completed, false) AS is_completed,
                COALESCE(upp.is_bookmarked, false) AS is_bookmarked
         FROM module_pages p
         LEFT JOIN user_page_progress upp ON p.id = upp.page_id AND upp.user_id = $2
         WHERE p.module_id = $1 AND p.status != 'ARCHIVED'
         ORDER BY p.display_order ASC, p.created_at ASC`,
        [moduleId, userId]
    );
    return result.rows;
};

// Retrieve a single page by ID
exports.getPageById = async (pageId) => {
    const result = await db.query(
        `SELECT * FROM module_pages WHERE id = $1`,
        [pageId]
    );
    return result.rows[0] || null;
};

// Find page by slug in a module
exports.getPageBySlug = async (moduleId, slug) => {
    const result = await db.query(
        `SELECT * FROM module_pages WHERE module_id = $1 AND slug = $2`,
        [moduleId, slug]
    );
    return result.rows[0] || null;
};

// Update page content
exports.updatePageContent = async (pageId, content) => {
    const result = await db.query(
        `UPDATE module_pages
         SET content = $2, updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [pageId, content]
    );
    return result.rows[0];
};

// Update page metadata
exports.updatePageMetadata = async (pageId, { title, slug, display_order, estimated_minutes, status }) => {
    const result = await db.query(
        `UPDATE module_pages
         SET title = $2, slug = $3, display_order = $4, estimated_minutes = $5, status = $6, updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [pageId, title, slug, display_order, estimated_minutes, status]
    );
    return result.rows[0];
};

// Create a new page
exports.createPage = async ({ module_id, title, slug, content = "", display_order = 1, estimated_minutes = 10, status = "DRAFT" }) => {
    const result = await db.query(
        `INSERT INTO module_pages (module_id, title, slug, content, display_order, estimated_minutes, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [module_id, title, slug, content, display_order, estimated_minutes, status]
    );
    return result.rows[0];
};

// Get user progress on page
exports.getUserPageProgress = async (userId, pageId) => {
    const result = await db.query(
        `SELECT * FROM user_page_progress WHERE user_id = $1 AND page_id = $2`,
        [userId, pageId]
    );
    return result.rows[0] || null;
};

// Upsert user page progress
exports.upsertUserPageProgress = async (userId, pageId, { is_completed, is_bookmarked, notes }) => {
    // Determine existing notes if not provided, or coalesce values
    const current = await exports.getUserPageProgress(userId, pageId);

    const finalCompleted = is_completed !== undefined ? is_completed : (current ? current.is_completed : false);
    const finalBookmarked = is_bookmarked !== undefined ? is_bookmarked : (current ? current.is_bookmarked : false);
    const finalNotes = notes !== undefined ? notes : (current ? current.notes : null);

    const result = await db.query(
        `INSERT INTO user_page_progress (user_id, page_id, is_completed, is_bookmarked, notes, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         ON CONFLICT (user_id, page_id) 
         DO UPDATE SET 
            is_completed = EXCLUDED.is_completed, 
            is_bookmarked = EXCLUDED.is_bookmarked, 
            notes = EXCLUDED.notes,
            updated_at = NOW()
         RETURNING *`,
        [userId, pageId, finalCompleted, finalBookmarked, finalNotes]
    );
    return result.rows[0];
};
