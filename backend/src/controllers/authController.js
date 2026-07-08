const authService = require("../services/authService");
const userRepository = require("../repositories/userRepository");
const asyncHandler = require("../utils/asyncHandler");
const emailService = require("../services/emailService");

// Banned domains for spam/throwaway emails
const BANNED_DOMAINS = [
  "mailinator.com", "yopmail.com", "tempmail.com", "10minutemail.com",
  "sharklasers.com", "guerrillamail.com", "dispostable.com",
  "getairmail.com", "burnermail.io"
];

exports.sendSignupOTP = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, error: "Email is required" });
  }

  // Validate format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ success: false, error: "Invalid email format" });
  }

  // Ban throwaway domains
  const domain = email.split("@")[1]?.toLowerCase();
  if (BANNED_DOMAINS.includes(domain)) {
    return res.status(400).json({ success: false, error: "Registration with temporary email domains is not allowed" });
  }

  // Check if already registered
  const existing = await userRepository.findByEmail(email);
  if (existing) {
    return res.status(400).json({ success: false, error: "Email is already registered" });
  }

  await emailService.sendSignupOTP(email);

  res.json({
    success: true,
    message: "OTP sent successfully",
    error: null
  });
});

exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, otp } = req.body;

  if (!email || !password || !otp) {
    return res.status(400).json({ success: false, error: "Email, password, and verification OTP code are required" });
  }

  // Verify OTP code
  const isVerified = emailService.verifyOTP(email, otp);
  if (!isVerified) {
    return res.status(400).json({ success: false, error: "Invalid or expired verification OTP code" });
  }

  const user = await authService.register({ name, email, password });
  res.status(201).json({
    success: true,
    data: user,
    error: null
  });
});

exports.login = asyncHandler(async (req, res) => {
  const token = await authService.login(req.body);
  res.json({
    success: true,
    data: { token },
    error: null
  });
});

exports.forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, error: "Email is required" });
  }

  const user = await userRepository.findByEmail(email);
  if (!user) {
    return res.status(404).json({ success: false, error: "No account registered with this email" });
  }

  // Send resetting OTP
  await emailService.sendSignupOTP(email);

  res.json({
    success: true,
    message: "Reset code sent to your email",
    error: null
  });
});

exports.resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword) {
    return res.status(400).json({ success: false, error: "Email, OTP code, and new password are required" });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ success: false, error: "Password must be at least 8 characters long" });
  }

  // Verify OTP
  const isVerified = emailService.verifyOTP(email, otp);
  if (!isVerified) {
    return res.status(400).json({ success: false, error: "Invalid or expired OTP code" });
  }

  await authService.resetPassword(email, newPassword);

  res.json({
    success: true,
    message: "Password reset successful",
    error: null
  });
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const { name, role, target_domain } = req.body;
  const updates = {};
  if (name !== undefined) updates.name = name;
  if (role !== undefined) updates.role = role;
  if (target_domain !== undefined) updates.target_domain = target_domain;

  const updatedUser = await userRepository.updateUser(req.user.userId, updates);
  res.json({
    success: true,
    data: updatedUser,
    error: null
  });
});

exports.me = asyncHandler(async (req, res) => {
  const user = await userRepository.findById(req.user.userId);

  if (!user) {
    return res.status(404).json({
      success: false,
      data: null,
      error: "User not found"
    });
  }

  res.json({
    success: true,
    data: user,
    error: null
  });
});