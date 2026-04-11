const express = require("express");
const router = express.Router();

const interviewController = require("../controllers/interviewController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/start", authMiddleware, interviewController.startInterview);
router.post("/message", authMiddleware, interviewController.sendMessage);
router.post("/finish", authMiddleware, interviewController.submitInterview);

module.exports = router;