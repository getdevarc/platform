const express = require("express");
const multer = require("multer");
const careerController = require("../controllers/careerController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// All routes are protected
router.use(authMiddleware);

// Upload resume for analysis
router.post("/analyze-resume", upload.single("resume"), careerController.analyzeResume);

// Complete onboarding questionnaire
router.post("/onboarding", careerController.completeOnboarding);

module.exports = router;