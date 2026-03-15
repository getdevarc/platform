const rateLimit = require("express-rate-limit");

exports.aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: {
    success: false,
    error: "Too many AI requests. Please try again later."
  }
});

exports.submissionLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: {
    success: false,
    error: "Too many submissions. Please slow down."
  }
});