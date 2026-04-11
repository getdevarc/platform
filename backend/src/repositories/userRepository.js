const db = require("../config/db");

exports.createUser = async ({ name, email, password, role, target_domain, career_answers, resume_text }) => {
  const result = await db.query(
    `INSERT INTO users(name, email, password, role, target_domain, career_answers, resume_text)
     VALUES($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, name, email, role, target_domain`,
    [name, email, password, role, target_domain, career_answers, resume_text]
  );

  return result.rows[0];
};

exports.findByEmail = async (email) => {
  const result = await db.query(
    `SELECT * FROM users WHERE email=$1`,
    [email]
  );

  return result.rows[0];
};

exports.findById = async (id) => {
  const result = await db.query(
    `SELECT id, name, email, role, target_domain, career_answers, resume_text FROM users WHERE id=$1`,
    [id]
  );

  return result.rows[0];
};
exports.updateUser = async (id, updates) => {
  const keys = Object.keys(updates);
  const values = Object.values(updates);
  
  const setString = keys
    .map((key, index) => `${key}=$${index + 2}`)
    .join(", ");

  const result = await db.query(
    `UPDATE users SET ${setString} WHERE id=$1 RETURNING *`,
    [id, ...values]
  );

  return result.rows[0];
};
