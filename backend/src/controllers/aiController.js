const aiService = require("../services/aiService");
const problemRepository = require("../repositories/problemRepository");
const asyncHandler = require("../utils/asyncHandler");

exports.getHint = asyncHandler(async (req, res) => {
  const { problemId, userCode, sessionId, hintLevel } = req.body;

  const problem = await problemRepository.getProblemById(problemId);
  if (!problem) {
    return res.status(404).json({ success: false, data: null, error: "Problem not found" });
  }

  const hint = await aiService.generateHint(
    problem,
    userCode,
    req.user.userId,
    sessionId,
    hintLevel
  );

  res.json({
    success: true,
    data: hint,
    error: null
  });
});

exports.getExplanation = asyncHandler(async (req, res) => {
  const { problemId, userCode, sessionId } = req.body;

  const problem = await problemRepository.getProblemById(problemId);
  if (!problem) {
    return res.status(404).json({ success: false, data: null, error: "Problem not found" });
  }

  const explanation = await aiService.generateExplanation(
    problem,
    userCode,
    req.user.userId,
    sessionId
  );

  res.json({
    success: true,
    data: explanation,
    error: null
  });
});

exports.getCodeReview = asyncHandler(async (req, res) => {
  const { problemId, userCode, sessionId } = req.body;

  const problem = await problemRepository.getProblemById(problemId);
  if (!problem) {
    return res.status(404).json({ success: false, data: null, error: "Problem not found" });
  }

  const review = await aiService.generateCodeReview(
    problem,
    userCode,
    req.user.userId,
    sessionId
  );

  res.json({
    success: true,
    data: review,
    error: null
  });
});