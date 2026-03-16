const express = require("express");
const router = express.Router();

const sessionController = require("../controllers/sessionController");
const authMiddleware = require("../middleware/authMiddleware");

router.post(
  "/start",
  authMiddleware,
  sessionController.startSession
);

module.exports = router;