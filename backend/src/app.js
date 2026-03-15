const express = require("express");
const cors = require("cors");

const loggerMiddleware = require("./middleware/logger");
const authRoutes = require("./routes/authRoutes");
const problemRoutes = require("./routes/problemRoutes");
const submissionRoutes = require("./routes/submissionRoutes");
const aiRoutes = require("./routes/aiRoutes");
const interviewRoutes = require("./routes/interviewRoutes");
const careerRoutes = require("./routes/careerRoutes");
const errorHandler = require("./middleware/errorHandler");
const logger = require("./config/logger");

const app = express();

app.use(loggerMiddleware);
app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "DevArc API running" });
});
logger.info("DevArc API initialized and ready to accept requests");
app.use("/auth", authRoutes);
app.use("/problems", problemRoutes);
app.use("/submissions", submissionRoutes);
app.use("/ai", aiRoutes);
app.use("/interview", interviewRoutes);
app.use("/career", careerRoutes);
app.use(errorHandler);

module.exports = app;