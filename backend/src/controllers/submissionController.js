const submissionService = require("../services/submissionService");
const asyncHandler = require("../utils/asyncHandler");

exports.createSubmission = asyncHandler(async (req, res) => {
  const submission = await submissionService.submitCode({
    userId: req.user.userId,
    problemId: req.body.problemId,
    code: req.body.code,
    language: req.body.language,
    sessionId: req.body.sessionId
  });

  res.json({
    success: true,
    data: submission,
    error: null
  });
});

exports.getSubmissions = asyncHandler(async (req, res) => {
  const submissions = await submissionService.getSubmissions(
    req.user.userId
  );

  res.json({
    success: true,
    data: submissions,
    error: null
  });
});

exports.submitCode = asyncHandler(async (req, res) => {
  const submission = await submissionService.submitCode({
    userId: req.user.userId,
    problemId: req.body.problemId,
    code: req.body.code,
    language: req.body.language,
    sessionId: req.body.sessionId
  });

  res.json({
    success: true,
    data: submission,
    error: null
  });
});
