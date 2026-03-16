const db = require("../config/db");

exports.logEvent = async (sessionId, eventType, metadata = {}) => {

  await db.query(
    `INSERT INTO solve_events (session_id, event_type, metadata)
     VALUES ($1,$2,$3)`,
    [sessionId, eventType, metadata]
  );

};