const express = require("express");
const router = express.Router();

const analyticsController = require("../controllers/analyticsController");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/dashboard", authMiddleware, analyticsController.getDashboardStats);
router.get("/history", authMiddleware, analyticsController.getSolveHistory);

module.exports = router;
