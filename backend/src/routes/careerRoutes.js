const express = require("express");
const router = express.Router();

const careerController = require("../controllers/careerController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/roadmap", authMiddleware, careerController.generateRoadmap);

module.exports = router;