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
  const { interviewId } = req.body;
  
  const interview = await interviewRepository.getInterviewById(interviewId);
  if (!interview) {
    return res.status(404).json({ success: false, error: "Interview not found" });
  }

  const evaluation = await aiService.generateFinalInterviewReport(interview.transcript);
  
  const updated = await interviewRepository.finishInterview(interviewId, evaluation);

  res.json({
    success: true,
    data: updated,
    error: null
  });
});