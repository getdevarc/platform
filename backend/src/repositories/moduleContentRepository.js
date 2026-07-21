const db = require("../config/db");

/**
 * Retrieve existing content for a specific user and module
 */
exports.getModuleContent = async (userId, moduleId) => {
    const result = await db.query(
        `SELECT * FROM user_module_content
     WHERE user_id = $1 AND module_id = $2`,
        [userId, moduleId]
    );
    return result.rows[0] || null;
};

/**
 * Upsert content to establish/replace stored value
 */
exports.upsertModuleContent = async (userId, moduleId, content) => {
    const result = await db.query(
        `INSERT INTO user_module_content (user_id, module_id, content, updated_at)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (user_id, module_id) DO UPDATE
     SET content = EXCLUDED.content, updated_at = NOW()
     RETURNING *`,
        [userId, moduleId, content]
    );
    return result.rows[0];
};
