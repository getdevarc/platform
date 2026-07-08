const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/send-signup-otp", authController.sendSignupOTP);
router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);
router.put("/profile", authMiddleware, authController.updateProfile);
router.get("/me", authMiddleware, authController.me);

module.exports = router;