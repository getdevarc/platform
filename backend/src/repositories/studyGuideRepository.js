const db = require("../config/db");

exports.upsertStudyGuide = async (userId, stepTitle, content, recommendedResources = []) => {
    const result = await db.query(
        `INSERT INTO study_guides (user_id, step_title, content, recommended_resources)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id, step_title) 
     DO UPDATE SET content = EXCLUDED.content, recommended_resources = EXCLUDED.recommended_resources, created_at = NOW()
     RETURNING *`,
        [userId, stepTitle, content, JSON.stringify(recommendedResources)]
    );
    return result.rows[0];
};

exports.getStudyGuide = async (userId, stepTitle) => {
    const result = await db.query(
        `SELECT * FROM study_guides WHERE user_id = $1 AND step_title = $2`,
        [userId, stepTitle]
    );
    return result.rows[0];
};

exports.getAllUserStudyGuides = async (userId) => {
    const result = await db.query(
        `SELECT * FROM study_guides WHERE user_id = $1 ORDER BY created_at DESC`,
        [userId]
    );
    return result.rows;
};
