const express = require("express");
const learnController = require("../controllers/learnController");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const router = express.Router();

// Require user authentication
router.use(authMiddleware);

// Retrieve all tracks
router.get("/tracks", learnController.getTracks);

// Retrieve individual track and modules list
router.get("/tracks/:trackId", learnController.getTrackDetail);

// Enroll in a training track
router.post("/enroll", learnController.enrollTrack);

// Update track learning session (PATCH)
router.patch("/tracks/:trackId/session", learnController.patchTrackSession);

// Lazy-generate or fetch module content
router.get("/modules/:moduleId/content", learnController.getModuleContent);

// Regenerate module content (Admin only)
router.post("/modules/:moduleId/content/regenerate", adminMiddleware, learnController.regenerateModuleContent);

// Lazy-generate or fetch module resources
router.get("/modules/:moduleId/resources", learnController.getModuleResources);

// Regenerate module resources (Admin only)
router.post("/modules/:moduleId/resources/regenerate", adminMiddleware, learnController.regenerateModuleResources);

// ============================================
// Sprint 7.1 Learning Pages Endpoints
// ============================================

// Fetch list of pages for a module
router.get("/modules/:moduleId/pages", learnController.getModulePages);

// Retrieve page study guide content
router.get("/pages/:pageId/content", learnController.getPageContent);

// Regenerate page content (Admin only)
router.post("/pages/:pageId/content/regenerate", adminMiddleware, learnController.regeneratePageContent);

// Retrieve page normalized resources
router.get("/pages/:pageId/resources", learnController.getPageResources);

// Regenerate page resources (Admin only)
router.post("/pages/:pageId/resources/regenerate", adminMiddleware, learnController.regeneratePageResources);

// Fetch user page progress parameters
router.get("/pages/:pageId/progress", learnController.getPageProgress);

// Update user page progress details (PATCH)
router.patch("/pages/:pageId/progress", learnController.patchPageProgress);

module.exports = router;

