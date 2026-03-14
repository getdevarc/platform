const express = require("express");
const router = express.Router();

const aiController = require("../controllers/aiController");
const authMiddleware = require("../middleware/authMiddleware");
const validate = require("../middleware/validate");
const { hintSchema } = require("../validators/aiValidator");

router.post("/hint", authMiddleware, aiController.getHint);
router.post("/explain", authMiddleware, aiController.getExplanation);
router.post("/review", authMiddleware, aiController.getCodeReview);
router.post("/hint", authMiddleware, validate(hintSchema), aiController.getHint);

module.exports = router;