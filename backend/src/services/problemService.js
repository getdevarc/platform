const problemRepository = require("../repositories/problemRepository");

exports.getProblems = async () => {
  return await problemRepository.getAllProblems();
};

exports.getProblem = async (id) => {
  const problem = await problemRepository.getProblemById(id);

  if (!problem) {
    throw new Error("Problem not found");
  }

  return problem;
};