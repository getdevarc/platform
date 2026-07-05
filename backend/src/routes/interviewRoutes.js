const express = require("express");
const router = express.Router();

const interviewController = require("../controllers/interviewController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/start", authMiddleware, interviewController.startInterview);
router.get("/session/:id", authMiddleware, interviewController.getInterviewSession);
router.post("/message", authMiddleware, interviewController.sendMessage);
router.post("/finish", authMiddleware, interviewController.submitInterview);
router.post("/evaluate-question", authMiddleware, interviewController.evaluateQuestion);
router.post("/next-question", authMiddleware, interviewController.nextQuestion);

module.exports = router;