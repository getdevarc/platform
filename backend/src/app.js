const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const loggerMiddleware = require("./middleware/logger");
const authRoutes = require("./routes/authRoutes");
const problemRoutes = require("./routes/problemRoutes");
const submissionRoutes = require("./routes/submissionRoutes");
const aiRoutes = require("./routes/aiRoutes");
const interviewRoutes = require("./routes/interviewRoutes");
const careerRoutes = require("./routes/careerRoutes");
const learnRoutes = require("./routes/learnRoutes");
const errorHandler = require("./middleware/errorHandler");
const logger = require("./config/logger");
const sessionRoutes = require("./routes/sessionRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const adminRoutes = require("./routes/adminRoutes");

const requestTracker = require("./middleware/requestTracker");
const healthScheduler = require("./services/healthScheduler");

const app = express();

// 1. Security configurations
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  optionsSuccessStatus: 200
}));

// Configure trusted reverse proxy IP headers
app.set("trust proxy", parseInt(process.env.TRUST_PROXY_HOPS) || 1);

// 2. Request Tracing & Logger middlewares
app.use(requestTracker);
app.use(loggerMiddleware);

app.use(express.json());

// Main dynamic health check routing
app.get("/health", (req, res) => {
  const schedulerStatus = healthScheduler.getStatus();
  const dbStatus = schedulerStatus.database_health.status;
  const aiStatus = schedulerStatus.ai_service.status;

  const isHealthy = dbStatus !== "DOWN" && aiStatus !== "DOWN";

  res.status(isHealthy ? 200 : 500).json({
    status: isHealthy ? "HEALTHY" : "UNHEALTHY",
    api: "UP",
    database: dbStatus,
    ai: aiStatus,
    scheduler: schedulerStatus
  });
});

logger.info("DevArc API configured with helmet security headers and trust proxy");

// 3. API Versioning Namespace Routing (/api/v1)
const apiRouter = express.Router();
apiRouter.use("/auth", authRoutes);
apiRouter.use("/problems", problemRoutes);
apiRouter.use("/submissions", submissionRoutes);
apiRouter.use("/ai", aiRoutes);
apiRouter.use("/interview", interviewRoutes);
apiRouter.use("/career", careerRoutes);
apiRouter.use("/learn", learnRoutes);
apiRouter.use("/admin", adminRoutes);
apiRouter.use("/sessions", sessionRoutes);
apiRouter.use("/analytics", analyticsRoutes);

app.use("/api/v1", apiRouter);

// 4. Legacy Flat Mappings for backward compatibility
app.use("/auth", authRoutes);
app.use("/problems", problemRoutes);
app.use("/submissions", submissionRoutes);
app.use("/ai", aiRoutes);
app.use("/interview", interviewRoutes);
app.use("/career", careerRoutes);
app.use("/learn", learnRoutes);
app.use("/admin", adminRoutes);
app.use("/sessions", sessionRoutes);
app.use("/analytics", analyticsRoutes);

// Register centralized error handler at the very bottom
app.use(errorHandler);

module.exports = app;