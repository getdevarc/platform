const express = require("express");
const router = express.Router();

const aiController = require("../controllers/aiController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/hint", authMiddleware, aiController.getHint);
router.post("/explain", authMiddleware, aiController.getExplanation);
router.post("/review", authMiddleware, aiController.getCodeReview);

module.exports = router;