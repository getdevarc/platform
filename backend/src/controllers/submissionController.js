const submissionService = require("../services/submissionService");

exports.createSubmission = async (req, res) => {
  try {
    const submission = await submissionService.submitCode({
      userId: req.user.userId,
      problemId: req.body.problemId,
      code: req.body.code,
      language: req.body.language
    });

    res.json(submission);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getSubmissions = async (req, res) => {
  try {
    const submissions = await submissionService.getSubmissions(
      req.user.userId
    );

    res.json(submissions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};