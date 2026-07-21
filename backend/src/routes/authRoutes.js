const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");
const validate = require("../middleware/validate");
const { registerSchema, loginSchema } = require("../validators/authValidator");
const { loginLimiter, otpLimiter, forgotPasswordLimiter } = require("../middleware/rateLimiter");

router.post("/send-signup-otp", otpLimiter, authController.sendSignupOTP);
router.post("/register", validate(registerSchema), authController.register);
router.post("/login", loginLimiter, validate(loginSchema), authController.login);
router.post("/forgot-password", forgotPasswordLimiter, authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);
router.put("/profile", authMiddleware, authController.updateProfile);
router.get("/me", authMiddleware, authController.me);

module.exports = router;