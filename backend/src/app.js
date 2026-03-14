const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const problemRoutes = require("./routes/problemRoutes");
const submissionRoutes = require("./routes/submissionRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "DevArc API running" });
});

app.use("/auth", authRoutes);
app.use("/problems", problemRoutes);
app.use("/submissions", submissionRoutes);

module.exports = app;