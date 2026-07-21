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

// Get latest active roadmap
router.get("/latest", careerController.getLatestRoadmap);

// Manually regenerate roadmap
router.post("/roadmap", careerController.generateRoadmap);

// Get all study guides for current user
router.get("/study-guides", careerController.getStudyGuides);

// Get step detailed assets (lazy generated or restored)
router.get("/step-details", careerController.getStepDetails);

// Manually regenerate milestones step guide
router.post("/study-guide/regenerate", careerController.regenerateStepDetails);

// Save progress metrics checklist modifications
router.post("/progress/project-task", careerController.updateProjectTask);
router.post("/progress/revision-task", careerController.updateRevisionItem);

// Legacy backwards-compatibility endpoints
router.post("/study-guide", careerController.saveStudyGuide);
router.post("/study-guide/generate", careerController.generateStudyGuide);

module.exports = router;