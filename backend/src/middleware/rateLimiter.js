const rateLimit = require("express-rate-limit");
const { RateLimitError } = require("../utils/errors");

// Helper handler to route rate limit errors through central Express errorHandler
const rateLimitHandler = (message) => (req, res, next) => {
  next(new RateLimitError(message));
};

exports.loginLimiter = rateLimit({
  windowMs: parseInt(process.env.LOGIN_LIMIT_WINDOW_MS) || 900000, // default 15 mins
  max: parseInt(process.env.LOGIN_LIMIT_MAX) || 5,
  handler: rateLimitHandler("Too many login attempts. Please try again later.")
});

exports.otpLimiter = rateLimit({
  windowMs: parseInt(process.env.OTP_LIMIT_WINDOW_MS) || 900000,
  max: parseInt(process.env.OTP_LIMIT_MAX) || 5,
  handler: rateLimitHandler("Too many OTP attempts. Please try again later.")
});

exports.forgotPasswordLimiter = rateLimit({
  windowMs: parseInt(process.env.FORGOT_PASSWORD_LIMIT_WINDOW_MS) || 900000,
  max: parseInt(process.env.FORGOT_PASSWORD_LIMIT_MAX) || 5,
  handler: rateLimitHandler("Too many password reset requests. Please try again later.")
});

exports.aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: parseInt(process.env.AI_LIMIT_MAX) || 10,
  handler: rateLimitHandler("Too many AI queries. Please session cool-down.")
});

exports.submissionLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: parseInt(process.env.SUBMISSION_LIMIT_MAX) || 20,
  handler: rateLimitHandler("Too many code submissions. Please slow execution rate down.")
});