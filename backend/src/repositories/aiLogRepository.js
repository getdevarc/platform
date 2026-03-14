const db = require("../config/db");

exports.createLog = async ({ userId, problemId, prompt, response }) => {

  const result = await db.query(
    `INSERT INTO ai_logs (user_id, problem_id, prompt, response)
     VALUES ($1,$2,$3,$4)
     RETURNING *`,
    [userId, problemId, prompt, response]
  );

  return result.rows[0];
};