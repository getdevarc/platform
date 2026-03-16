const db = require("../config/db");

exports.createSession = async (userId, problemId) => {
  const result = await db.query(
    `INSERT INTO solve_sessions (user_id, problem_id)
     VALUES ($1,$2) RETURNING *`,
    [userId, problemId]
  );
  return result.rows[0];
};

exports.endSession = async (sessionId) => {
  await db.query(
    `UPDATE solve_sessions
     SET ended_at = NOW()
     WHERE id = $1`,
    [sessionId]
  );
};