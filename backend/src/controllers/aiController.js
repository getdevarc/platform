const aiService = require("../services/aiService");
const problemRepository = require("../repositories/problemRepository");

exports.getHint = async (req, res) => {

  try {

    const { problemId, userCode } = req.body;

    const problem =
      await problemRepository.getProblemById(problemId);

    if (!problem) {
      return res.status(404).json({ error: "Problem not found" });
    }

    const hint =
      await aiService.generateHint(problem, userCode);

    res.json({
      hint
    });

  } catch (error) {

    res.status(500).json({
      error: error.message
    });

  }
};