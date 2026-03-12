const express = require("express");
const router = express.Router();

const problemController = require("../controllers/problemController");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/", authMiddleware, problemController.getProblems);
router.get("/:id", authMiddleware, problemController.getProblem);

module.exports = router;