const db = require("../config/db");

exports.createRoadmap = async (userId, goal, content) => {
  const result = await db.query(
    `INSERT INTO roadmaps (user_id, goal, content)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [userId, goal, JSON.stringify(content)]
  );
  return result.rows[0];
};

exports.getLatestRoadmap = async (userId) => {
  const result = await db.query(
    `SELECT * FROM roadmaps WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [userId]
  );
  return result.rows[0];
};

exports.getUserRoadmaps = async (userId) => {
  const result = await db.query(
    `SELECT * FROM roadmaps WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId]
  );
  return result.rows;
};
