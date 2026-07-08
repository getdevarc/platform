const submissionService = require("../services/submissionService");
const asyncHandler = require("../utils/asyncHandler");

const getLanguageName = (body) => {
  if (body.language) return body.language.toLowerCase();
  const id = parseInt(body.languageId, 10);
  if (id === 63) return "javascript";
  if (id === 71) return "python";
  if (id === 54) return "cpp";
  if (id === 62) return "java";
  return "javascript";
};

exports.createSubmission = asyncHandler(async (req, res) => {
  const submission = await submissionService.submitCode({
    userId: req.user.userId,
    problemId: req.body.problemId,
    code: req.body.code || req.body.sourceCode,
    language: getLanguageName(req.body),
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
    code: req.body.code || req.body.sourceCode,
    language: getLanguageName(req.body),
    sessionId: req.body.sessionId
  });

  res.json({
    success: true,
    data: submission,
    error: null
  });
});
