const express = require("express");
const router = express.Router();

const sessionController = require("../controllers/sessionController");
const authMiddleware = require("../middleware/authMiddleware");

router.post(
  "/start",
  authMiddleware,
  sessionController.startSession
);

router.get(
  "/active/:problemId",
  authMiddleware,
  sessionController.getActiveSession
);

router.get(
  "/:sessionId/insights",
  authMiddleware,
  sessionController.getSessionInsights
);

module.exports = router;