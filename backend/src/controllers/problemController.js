const problemService = require("../services/problemService");
const asyncHandler = require("../utils/asyncHandler");

exports.getProblems = asyncHandler(async (req, res) => {
  const problems = await problemService.getProblems();
  res.json({
    success: true,
    data: problems,
    error: null
  });
});

exports.getProblem = asyncHandler(async (req, res) => {
  const problem = await problemService.getProblem(req.params.id);
  if (!problem) {
    return res.status(404).json({
      success: false,
      data: null,
      error: "Problem not found"
    });
  }
  res.json({
    success: true,
    data: problem,
    error: null
  });
});