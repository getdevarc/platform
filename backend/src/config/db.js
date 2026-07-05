const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 5000,   // fail fast if can't connect
  idleTimeoutMillis: 10000,
  max: 10,
});

pool.on("error", (err) => {
  console.error("[DB] Unexpected client error:", err.message);
});

module.exports = pool;