const submissionRepository = require("../repositories/submissionRepository");

exports.submitCode = async (data) => {
  return await submissionRepository.createSubmission(data);
};

exports.getSubmissions = async (userId) => {
  return await submissionRepository.getUserSubmissions(userId);
};