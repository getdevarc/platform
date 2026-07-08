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

exports.findActiveSession = async (userId, problemId) => {
  const result = await db.query(
    `SELECT * FROM solve_sessions 
     WHERE user_id = $1 AND problem_id = $2 AND ended_at IS NULL
     ORDER BY created_at DESC LIMIT 1`,
    [userId, problemId]
  );
  return result.rows[0];
};

exports.getSessionById = async (id) => {
  const result = await db.query(
    `SELECT * FROM solve_sessions WHERE id = $1`,
    [id]
  );
  return result.rows[0];
};

exports.deductPoints = async (sessionId, points) => {
  const result = await db.query(
    `UPDATE solve_sessions
     SET score = GREATEST(0, score - $1)
     WHERE id = $2
     RETURNING score`,
    [points, sessionId]
  );
  return result.rows[0]?.score ?? 0;
};