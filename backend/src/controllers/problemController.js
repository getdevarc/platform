const problemService = require("../services/problemService");

exports.getProblems = async (req, res) => {
  try {
    const problems = await problemService.getProblems();
    res.json(problems);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getProblem = async (req, res) => {
  try {
    const problem = await problemService.getProblem(req.params.id);
    res.json(problem);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};