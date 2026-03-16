const sessionService = require("../services/sessionService");

exports.startSession = async (req, res) => {

  const { problemId } = req.body;

  const session = await sessionService.startSession(
    req.user.userId,
    problemId
  );

  res.json({
    sessionId: session.id
  });

};