const sessionRepository = require("../repositories/sessionRepository");

exports.startSession = async (userId, problemId) => {

  return await sessionRepository.createSession(
    userId,
    problemId
  );

};

exports.endSession = async (sessionId) => {

  await sessionRepository.endSession(sessionId);

};