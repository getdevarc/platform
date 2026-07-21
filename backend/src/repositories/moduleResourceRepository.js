const db = require("../config/db");

/**
 * Retrieve resource suggestions for a specific user and learning module
 */
exports.getModuleResources = async (userId, moduleId) => {
    const result = await db.query(
        `SELECT * FROM user_module_resources
     WHERE user_id = $1 AND module_id = $2`,
        [userId, moduleId]
    );
    return result.rows[0] || null;
};

/**
 * Write/update resource suggestions list
 */
exports.upsertModuleResources = async (userId, moduleId, resourcesArray) => {
    const result = await db.query(
        `INSERT INTO user_module_resources (user_id, module_id, resources, updated_at)
     VALUES ($1, $2, $3::jsonb, NOW())
     ON CONFLICT (user_id, module_id) DO UPDATE
     SET resources = EXCLUDED.resources, updated_at = NOW()
     RETURNING *`,
        [userId, moduleId, JSON.stringify(resourcesArray)]
    );
    return result.rows[0];
};
