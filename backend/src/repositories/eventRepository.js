const db = require("../config/db");

exports.logEvent = async (sessionId, eventType, metadata = {}) => {

  await db.query(
    `INSERT INTO solve_events (session_id, event_type, metadata)
     VALUES ($1,$2,$3)`,
    [sessionId, eventType, metadata]
  );

};

exports.getEventsBySessionId = async (sessionId) => {
  const result = await db.query(
    `SELECT * FROM solve_events WHERE session_id = $1 ORDER BY created_at ASC`,
    [sessionId]
  );
  return result.rows;
};