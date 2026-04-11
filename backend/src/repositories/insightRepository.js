const db = require("../config/db");

exports.createInsight = async ({ 
  sessionId, 
  analysis_text, 
  strengths, 
  weaknesses, 
  topics, 
  recommended_problems 
}) => {
  const result = await db.query(
    `INSERT INTO solve_insights(
      session_id, 
      analysis_text, 
      strengths, 
      weaknesses, 
      topics, 
      recommended_problems
    )
    VALUES($1, $2, $3, $4, $5, $6)
    RETURNING *`,
    [sessionId, analysis_text, strengths, weaknesses, topics, recommended_problems]
  );

  return result.rows[0];
};

exports.getInsightBySessionId = async (sessionId) => {
  const result = await db.query(
    `SELECT * FROM solve_insights WHERE session_id = $1`,
    [sessionId]
  );

  return result.rows[0];
};

exports.getUserInsightsHistory = async (userId) => {
  const result = await db.query(
    `SELECT si.*, p.title as problem_title, p.difficulty as problem_difficulty
     FROM solve_insights si
     JOIN solve_sessions ss ON si.session_id = ss.id
     JOIN problems p ON ss.problem_id = p.id
     WHERE ss.user_id = $1
     ORDER BY si.created_at DESC`,
    [userId]
  );

  return result.rows;
};
