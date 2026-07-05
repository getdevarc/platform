const interviewRepository = require("../repositories/interviewRepository");
const aiService = require("../services/aiService");
const asyncHandler = require("../utils/asyncHandler");

exports.startInterview = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { type } = req.body;
  const question = await aiService.generateInterviewQuestion(type || "DSA");

  const interview = await interviewRepository.createInterview(userId, question);

  res.json({
    success: true,
    data: interview,
    error: null
  });
});

exports.sendMessage = asyncHandler(async (req, res) => {
  const { interviewId, message } = req.body;

  const interview = await interviewRepository.getInterviewById(interviewId);
  if (!interview) {
    return res.status(404).json({ success: false, error: "Interview not found" });
  }

  const transcript = interview.transcript || [];

  // Get AI response with context
  const aiMessage = await aiService.generateConversationalResponse(transcript, message);

  // Update transcript
  const updatedTranscript = [
    ...transcript,
    { role: "user", content: message },
    { role: "assistant", content: aiMessage }
  ];

  await interviewRepository.updateTranscript(interviewId, updatedTranscript);

  res.json({
    success: true,
    data: { response: aiMessage },
    error: null
  });
});

exports.submitInterview = asyncHandler(async (req, res) => {
  const { interviewId, code, language, completedQuestions } = req.body;

  const interview = await interviewRepository.getInterviewById(interviewId);
  if (!interview) {
    return res.status(404).json({ success: false, error: "Interview not found" });
  }

  const evaluation = await aiService.generateConsolidatedInterviewReport(
    interview.transcript,
    completedQuestions || []
  );

  const updated = await interviewRepository.finishInterview(interviewId, evaluation);

  res.json({
    success: true,
    data: updated,
    error: null
  });
});

exports.evaluateQuestion = asyncHandler(async (req, res) => {
  const { interviewId, code, language, questionText } = req.body;
  if (!interviewId || !code) {
    return res.status(400).json({ success: false, error: "interviewId and code are required." });
  }

  const interview = await interviewRepository.getInterviewById(interviewId);
  if (!interview) {
    return res.status(404).json({ success: false, error: "Interview not found" });
  }

  const result = await aiService.evaluateCodeAgainstTests(questionText || interview.question, code, language || "javascript");

  const transcript = interview.transcript || [];
  const aiReviewMessage = `[System Evaluation Log for solved question]
Feedback: ${result.feedback}
Passed Cases: ${result.testCases.filter(t => t.passed).length}/${result.testCases.length}

Hiring Advisor Comment: Please proceed to the next question when ready.`;

  const updatedTranscript = [
    ...transcript,
    { role: "assistant", content: aiReviewMessage }
  ];

  await interviewRepository.updateTranscript(interviewId, updatedTranscript);

  res.json({
    success: true,
    data: {
      evaluationResult: result,
      updatedTranscript
    },
    error: null
  });
});

exports.nextQuestion = asyncHandler(async (req, res) => {
  const { interviewId, type } = req.body;
  if (!interviewId) {
    return res.status(400).json({ success: false, error: "interviewId is required." });
  }

  const interview = await interviewRepository.getInterviewById(interviewId);
  if (!interview) {
    return res.status(404).json({ success: false, error: "Interview not found" });
  }

  const newQuestion = await aiService.generateInterviewQuestion(type || "DSA");

  const transcript = interview.transcript || [];
  const updatedTranscript = [
    ...transcript,
    { role: "assistant", content: `Here is your next question:\n\n${newQuestion}` }
  ];

  await interviewRepository.updateTranscript(interviewId, updatedTranscript);

  res.json({
    success: true,
    data: {
      newQuestion,
      updatedTranscript
    },
    error: null
  });
});

exports.getInterviewSession = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const interview = await interviewRepository.getInterviewById(id);
  if (!interview) {
    return res.status(404).json({ success: false, error: "Interview not found" });
  }
  res.json({
    success: true,
    data: interview,
    error: null
  });
});

exports.testCode = asyncHandler(async (req, res) => {
  const { interviewId, code, language } = req.body;
  if (!interviewId || !code) {
    return res.status(400).json({ success: false, error: "interviewId and code are required." });
  }

  const interview = await interviewRepository.getInterviewById(interviewId);
  if (!interview) {
    return res.status(404).json({ success: false, error: "Interview not found" });
  }

  const result = await aiService.evaluateCodeAgainstTests(interview.question, code, language || "javascript");

  res.json({
    success: true,
    data: result,
    error: null
  });
});