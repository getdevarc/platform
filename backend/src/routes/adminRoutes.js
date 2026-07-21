const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const validate = require("../middleware/validate");
// Admin validation import changes
const {
    createPageSchema,
    updatePageSchema,
    reorderPagesSchema,
    reorderModulesSchema,
    createResourceSchema,
    updateResourceSchema
} = require("../validators/adminValidator");

// All admin routes require authentication and admin privileges
router.use(authMiddleware);
router.use(adminMiddleware);

// Stats route
router.get("/stats", adminController.getStats);

// Users routes
router.get("/users", adminController.getAllUsers);
router.put("/users/:id/role", adminController.updateUserRole);

// Track routes
router.get("/tracks", adminController.getTracks);
router.post("/tracks", adminController.createTrack);
router.put("/tracks/:id", adminController.updateTrack);
router.delete("/tracks/:id", adminController.archiveTrack);
router.post("/tracks/:id/restore", adminController.restoreTrack);

// Module routes under track
router.get("/tracks/:trackId/modules", adminController.getTrackModules);
router.post("/tracks/:trackId/modules", adminController.createModule);
router.put("/modules/:id", adminController.updateModule);
router.delete("/modules/:id", adminController.deleteModule);
router.post("/modules/reorder", validate(reorderModulesSchema), adminController.reorderModules);

// CMS Page routes
router.get("/modules/:moduleId/pages", adminController.getModulePages);
router.post("/modules/:moduleId/pages", validate(createPageSchema), adminController.createModulePage);
router.put("/pages/:id", validate(updatePageSchema), adminController.updateModulePage);
router.delete("/pages/:id", adminController.deleteModulePage);
router.post("/pages/reorder", validate(reorderPagesSchema), adminController.reorderPages);
router.post("/pages/:id/draft", adminController.generatePageDraft);

// Curated Resource routes
router.get("/pages/:pageId/resources", adminController.getPageResourcesAdmin);
router.post("/pages/:pageId/resources", validate(createResourceSchema), adminController.createPageResource);
router.put("/resources/:id", validate(updateResourceSchema), adminController.updatePageResource);
router.delete("/resources/:id", adminController.deletePageResource);
router.post("/pages/:pageId/resources/reorder", adminController.reorderPageResources);

// Association mapping routes for curated resources
router.post("/resources/:id/associations", adminController.createAssociation);
router.delete("/resources/associations/:associationId", adminController.deleteAssociation);
router.get("/resources", adminController.getResources);

// Platform Settings routes
router.get("/settings", adminController.getSettings);
router.put("/settings/:key", adminController.updateSetting);

module.exports = router;

