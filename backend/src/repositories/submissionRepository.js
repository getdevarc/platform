const db = require("../config/db");

exports.createSubmission = async (submission) => {
  const { userId, problemId, code, language } = submission;

  const result = await db.query(
    `INSERT INTO submissions (user_id, problem_id, code, language)
     VALUES ($1,$2,$3,$4)
     RETURNING *`,
    [userId, problemId, code, language]
  );

  return result.rows[0];
};

exports.getUserSubmissions = async (userId) => {
  const result = await db.query(
    `SELECT * FROM submissions WHERE user_id=$1 ORDER BY created_at DESC`,
    [userId]
  );

  return result.rows;
};