const submissionRepository = require("../repositories/submissionRepository");
const executionService = require("./executionService");
const languages = require("../constants/languages");

exports.submitCode = async (data) => {

  const submission =
    await submissionRepository.createSubmission(data);

  const languageId = languages[data.language];

  const result = await executionService.executeCode(
    data.code,
    languageId
  );

  console.log("Judge0 Result:", result);

  return submission;
};

exports.getSubmissions = async (userId) => {
  return await submissionRepository.getUserSubmissions(userId);
};