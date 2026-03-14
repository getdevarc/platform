const aiService = require("../services/aiService");
const problemRepository = require("../repositories/problemRepository");

exports.getHint = async (req, res) => {

    try {

        const { problemId, userCode } = req.body;

        const problem =
            await problemRepository.getProblemById(problemId);

        const hint =
            await aiService.generateHint(problem, userCode, req.user.userId);

        res.json({
            hint
        });

    } catch (error) {

        res.status(500).json({
            error: error.message
        });

    }
};

exports.getExplanation = async (req, res) => {

  try {

    const { problemId, userCode } = req.body;

    const problem =
      await problemRepository.getProblemById(problemId);

    const explanation =
      await aiService.generateExplanation(
        problem,
        userCode,
        req.user.userId
      );

    res.json({ explanation });

  } catch (error) {

    res.status(500).json({
      error: error.message
    });

  }
};

exports.getCodeReview = async (req, res) => {

  try {

    const { problemId, userCode } = req.body;

    const problem =
      await problemRepository.getProblemById(problemId);

    if (!problem) {
      return res.status(404).json({ error: "Problem not found" });
    }

    const review =
      await aiService.generateCodeReview(
        problem,
        userCode,
        req.user.userId
      );

    res.json({ review });

  } catch (error) {

    res.status(500).json({
      error: error.message
    });

  }
};