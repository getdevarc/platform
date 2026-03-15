const submissionRepository = require("../repositories/submissionRepository");
const problemRepository = require("../repositories/problemRepository");
const testCaseService = require("./testCaseService");
const languages = require("../constants/languages");
const logger = require("../config/logger");

exports.submitCode = async (data) => {

  const submission = await submissionRepository.createSubmission(data);

  const problem = await problemRepository.getProblemById(data.problemId);

  if (!problem) {
    throw new Error("Problem not found");
  }

  const languageId = languages[data.language];
  
  const result = await testCaseService.runTestCases(
    data.code,
    languageId,
    problem.test_cases
  );

  await submissionRepository.updateStatus(
    submission.id,
    result.status
  );

  logger.info("Code submitted for problem", { problemId: data.problemId, submissionId: submission.id });


  return {
    submissionId: submission.id,
    status: result.status
  };
};

exports.getSubmissions = async (userId) => {
  return await submissionRepository.getUserSubmissions(userId);
};