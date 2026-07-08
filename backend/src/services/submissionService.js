const submissionRepository = require("../repositories/submissionRepository");
const problemRepository = require("../repositories/problemRepository");
const testCaseService = require("./testCaseService");
const languages = require("../constants/languages");
const logger = require("../config/logger");
const eventService = require("./eventService");
const sessionService = require("./sessionService");

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
    problem.test_cases,
    data.sessionId
  );

  if (data.sessionId) {
    await eventService.logEvent(
      data.sessionId,
      "submission"
    );

    if (result.status === "accepted") {
      await sessionService.endSession(data.sessionId);
    }
  }

  const cases = result.testCases || [];
  const passedCasesCount = cases.filter(c => c.passed).length;
  const totalCasesCount = cases.length;

  let sessionScore = 100;
  if (data.sessionId) {
    const sessionRepository = require("../repositories/sessionRepository");
    const session = await sessionRepository.getSessionById(data.sessionId);
    if (session) {
      sessionScore = session.score;
    }
  }

  const score = Math.round((passedCasesCount / Math.max(1, totalCasesCount)) * sessionScore);

  await submissionRepository.updateStatus(
    submission.id,
    result.status,
    passedCasesCount,
    totalCasesCount,
    score
  );

  logger.info("Code submitted for problem", { problemId: data.problemId, submissionId: submission.id });


  return {
    submissionId: submission.id,
    status: result.status,
    testCases: result.testCases,
    score: score
  };
};

exports.getSubmissions = async (userId) => {
  return await submissionRepository.getUserSubmissions(userId);
};