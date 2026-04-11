const db = require("../config/db");

exports.createInterview = async (userId, question) => {
  const result = await db.query(
    `INSERT INTO interviews (user_id, question, status)
     VALUES ($1, $2, 'ongoing')
     RETURNING *`,
    [userId, question]
  );
  return result.rows[0];
};

exports.getInterviewById = async (id) => {
  const result = await db.query(
    `SELECT * FROM interviews WHERE id = $1`,
    [id]
  );
  return result.rows[0];
};

exports.updateTranscript = async (id, transcript) => {
  const result = await db.query(
    `UPDATE interviews 
     SET transcript = $1 
     WHERE id = $2 
     RETURNING *`,
    [JSON.stringify(transcript), id]
  );
  return result.rows[0];
};

exports.finishInterview = async (id, evaluation) => {
  const result = await db.query(
    `UPDATE interviews 
     SET evaluation = $1, status = 'completed' 
     WHERE id = $2 
     RETURNING *`,
    [JSON.stringify(evaluation), id]
  );
  return result.rows[0];
};

exports.getUserInterviews = async (userId) => {
  const result = await db.query(
    `SELECT * FROM interviews WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId]
  );
  return result.rows;
};
