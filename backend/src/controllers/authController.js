const authService = require("../services/authService");
const userRepository = require("../repositories/userRepository");
const asyncHandler = require("../utils/asyncHandler");

exports.register = asyncHandler(async (req, res) => {
  const user = await authService.register(req.body);
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