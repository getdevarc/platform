const sessionService = require("../services/sessionService");
const eventService = require("../services/eventService");
const asyncHandler = require("../utils/asyncHandler");

exports.startSession = asyncHandler(async (req, res) => {
  const { problemId } = req.body;

  const session = await sessionService.startSession(
    req.user.userId,
    problemId
  );

  // Log "problem_opened" event
  await eventService.logEvent(
    session.id,
    "problem_opened"
  );

  res.json({
    success: true,
    data: { sessionId: session.id },
    error: null
  });
});

exports.getSessionInsights = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;

  const insights = await sessionService.getSessionInsights(
    sessionId,
    req.user.userId
  );

  res.json({
    success: true,
    data: insights,
    error: null
  });
});