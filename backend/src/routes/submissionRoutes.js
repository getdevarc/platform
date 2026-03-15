const express = require("express");
const router = express.Router();

const submissionController = require("../controllers/submissionController");
const authMiddleware = require("../middleware/authMiddleware");
const { submissionLimiter } = require("../middleware/rateLimiter");

const validate = require("../middleware/validate");
const { submitCodeSchema } = require("../validators/submissionValidator");

router.post("/", authMiddleware, submissionController.createSubmission);
router.get("/", authMiddleware, submissionController.getSubmissions);
router.post("/submit", authMiddleware, validate(submitCodeSchema), submissionController.submitCode);
router.post("/", authMiddleware, submissionLimiter, validate(submitCodeSchema), submissionController.submitCode);

module.exports = router;
