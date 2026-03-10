const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

console.log("App initialized");   // <-- add this

app.get("/health", (req, res) => {
  console.log("Health endpoint hit");   // <-- add this
  res.json({ status: "DevArc API running" });
});

module.exports = app;