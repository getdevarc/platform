const { Pool } = require("pg");
const logger = require("./logger");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 5000,   // fail fast if can't connect
  idleTimeoutMillis: 10000,
  max: 10,
});

pool.on("error", (err) => {
  logger.error({ err, service: "database" }, `Database connection pool unexpected error: ${err.message}`);
});

module.exports = pool;