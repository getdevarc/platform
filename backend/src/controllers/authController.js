const authService = require("../services/authService");
const userRepository = require("../repositories/userRepository");
const asyncHandler = require("../utils/asyncHandler");
const emailService = require("../services/emailService");
const response = require("../utils/response");
const { ValidationError, AuthenticationError, NotFoundError, ErrorCodes } = require("../utils/errors");

// Banned domains for spam/throwaway emails
const BANNED_DOMAINS = [
  "mailinator.com", "yopmail.com", "tempmail.com", "10minutemail.com",
  "sharklasers.com", "guerrillamail.com", "dispostable.com",
  "getairmail.com", "burnermail.io"
];

exports.sendSignupOTP = asyncHandler(async (req, res, next) => {
  const { email } = req.body;
  if (!email) {
    throw new ValidationError("Email is required");
  }

  // Validate format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError("Invalid email format");
  }

  // Ban throwaway domains
  const domain = email.split("@")[1]?.toLowerCase();
  if (BANNED_DOMAINS.includes(domain)) {
    throw new ValidationError("Registration with temporary email domains is not allowed");
  }

  // Check if already registered
  const existing = await userRepository.findByEmail(email);
  if (existing) {
    throw new AuthenticationError("Email is already registered", ErrorCodes.AUTH_REGISTRATION_FAILED);
  }

  await emailService.sendSignupOTP(email);

  return response.success(res, null, "OTP sent successfully");
});

exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, otp } = req.body;

  if (!otp) {
    throw new ValidationError("Verification OTP code is required");
  }

  // Verify OTP code
  const isVerified = emailService.verifyOTP(email, otp);
  if (!isVerified) {
    throw new ValidationError("Invalid or expired verification OTP code");
  }

  const user = await authService.register({ name, email, password });
  // Send welcome email on successful registration (after user is created in DB)
  await emailService.sendWelcomeEmail(user.email, name);

  return response.success(res, user, "User registered successfully", 201);
});

exports.login = asyncHandler(async (req, res) => {
  const token = await authService.login(req.body);
  return response.success(res, { token }, "Login successful");
});

exports.forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    throw new ValidationError("Email is required");
  }

  const user = await userRepository.findByEmail(email);
  if (!user) {
    throw new NotFoundError("No account registered with this email");
  }

  // Send resetting OTP from support@getdevarc.com
  await emailService.sendResetPasswordOTP(email);

  return response.success(res, null, "Reset code sent to your email");
});

exports.resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword) {
    throw new ValidationError("Email, OTP code, and new password are required");
  }

  if (newPassword.length < 8) {
    throw new ValidationError("Password must be at least 8 characters long");
  }

  // Verify OTP
  const isVerified = emailService.verifyOTP(email, otp);
  if (!isVerified) {
    throw new ValidationError("Invalid or expired OTP code");
  }

  await authService.resetPassword(email, newPassword);
  // Send password reset confirmation email from support@getdevarc.com
  await emailService.sendPasswordResetConfirmation(email);

  return response.success(res, null, "Password reset successful");
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const { name, role, target_domain } = req.body;
  const updates = {};
  if (name !== undefined) updates.name = name;
  if (role !== undefined) updates.role = role;
  if (target_domain !== undefined) updates.target_domain = target_domain;

  const updatedUser = await userRepository.updateUser(req.user.userId, updates);
  return response.success(res, updatedUser, "Profile updated successfully");
});

exports.me = asyncHandler(async (req, res) => {
  const user = await userRepository.findById(req.user.userId);

  if (!user) {
    throw new NotFoundError("User not found");
  }

  return response.success(res, user, "User details retrieved successfully");
});