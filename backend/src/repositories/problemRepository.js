const db = require("../config/db");

exports.getAllProblems = async () => {
  const result = await db.query(
    `SELECT id,title,difficulty FROM problems ORDER BY created_at DESC`
  );

  return result.rows;
};

exports.getProblemById = async (id) => {
  const result = await db.query(
    `SELECT * FROM problems WHERE id=$1`,
    [id]
  );

  return result.rows[0];
};