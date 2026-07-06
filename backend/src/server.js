require("dotenv").config();

const app = require("./app");
const db = require("./config/db");

const PORT = process.env.PORT || 5050;

const server = app.listen(PORT, () => {
  console.log(`DevArc API running on port ${PORT}`);
});

let isShuttingDown = false;

const gracefulShutdown = (signal) => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`[SERVER] Received ${signal}. Starting graceful shutdown...`);

  const forcedTimeout = setTimeout(() => {
    console.error("[SERVER] Graceful shutdown timed out. Forcing exit...");
    process.exit(1);
  }, 10000);

  // Stop accepting new HTTP requests
  server.close(async (err) => {
    if (err) {
      console.error("[SERVER] Error during server socket close:", err);
      clearTimeout(forcedTimeout);
      process.exit(1);
    }
    console.log("[SERVER] HTTP server closed.");

    // Close Database Pool
    try {
      await db.end();
      console.log("[DB] Database connection pool closed.");
      clearTimeout(forcedTimeout);
      process.exit(0);
    } catch (dbErr) {
      console.error("[DB] Database pool shutdown error:", dbErr);
      clearTimeout(forcedTimeout);
      process.exit(1);
    }
  });
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));