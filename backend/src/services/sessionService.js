const sessionRepository = require("../repositories/sessionRepository");
const eventRepository = require("../repositories/eventRepository");
const insightRepository = require("../repositories/insightRepository");
const aiService = require("./aiService");

exports.startSession = async (userId, problemId, forceNew = false) => {
  const existing = await sessionRepository.findActiveSession(userId, problemId);
  if (existing) {
    if (forceNew) {
      await sessionRepository.endSession(existing.id);
    } else {
      return existing;
    }
  }
  return await sessionRepository.createSession(
    userId,
    problemId
  );
};

exports.getActiveSession = async (userId, problemId) => {
  return await sessionRepository.findActiveSession(userId, problemId);
};

exports.endSession = async (sessionId) => {
  // End the session in the DB
  await sessionRepository.endSession(sessionId);

  // Generate and Persist the "Final Solve Insight" automatically
  try {
    const events = await eventRepository.getEventsBySessionId(sessionId);
    const insights = await aiService.generateSolveInsights(events);

    await insightRepository.createInsight({
      sessionId: sessionId,
      analysis_text: insights.analysis,
      strengths: insights.strengths,
      weaknesses: insights.weaknesses,
      topics: insights.topics,
      recommended_problems: insights.recommended_problems
    });
  } catch (err) {
    console.error("Failed to persist end-of-session insights:", err);
  }
};

exports.getSessionInsights = async (sessionId) => {
  // Check if insights already exist
  const existing = await insightRepository.getInsightBySessionId(sessionId);
  if (existing) return existing;

  // Otherwise generate (for legacy or edge cases)
  const events = await eventRepository.getEventsBySessionId(sessionId);
  const insights = await aiService.generateSolveInsights(events);

  // Consider persisting here too
  return insights;
};

exports.getUserHistory = async (userId) => {
  return await insightRepository.getUserInsightsHistory(userId);
};