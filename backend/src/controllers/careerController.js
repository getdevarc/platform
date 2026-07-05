const careerService = require("../services/careerService");
const userRepository = require("../repositories/userRepository");
const roadmapRepository = require("../repositories/roadmapRepository");
const asyncHandler = require("../utils/asyncHandler");

exports.analyzeResume = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: "No resume file uploaded."
    });
  }

  const analysis = await careerService.analyzeResume(req.file.buffer);

  // Store extracted text in user record
  await userRepository.updateUser(req.user.userId, {
    resume_text: analysis.text
  });

  res.json({
    success: true,
    data: analysis.analysis,
    error: null
  });
});

exports.completeOnboarding = asyncHandler(async (req, res) => {
  const { role, target_domain, answers } = req.body;

  if (!role || !target_domain) {
    return res.status(400).json({
      success: false,
      error: "Role and Target Domain are required."
    });
  }

  // Update profile basic info
  await userRepository.updateUser(req.user.userId, {
    role,
    target_domain,
    career_answers: Array.isArray(answers) ? JSON.stringify(answers) : answers
  });

  // Fetch updated user to get resume context
  const user = await userRepository.findById(req.user.userId);

  // Generate Roadmap if resume text exists
  let roadmap = null;
  if (user.resume_text) {
    try {
      // Re-analyze the stored text directly
      const analysisResults = await careerService.analyzeResumeText(user.resume_text);
      roadmap = await careerService.generatePersonalizedRoadmap(user.id, { role, target_domain, answers }, analysisResults);

      await roadmapRepository.createRoadmap(user.id, target_domain, roadmap);
    } catch (e) {
      console.error("Roadmap generation failed during onboarding:", e);
    }
  }

  res.json({
    success: true,
    data: {
      message: "Onboarding completed successfully.",
      roadmap: roadmap ? roadmap.rawContent : "Complete your resume upload to generate a personalized roadmap."
    },
    error: null
  });
});

exports.getLatestRoadmap = asyncHandler(async (req, res) => {
  const latestRoadmap = await roadmapRepository.getLatestRoadmap(req.user.userId);
  res.json({
    success: true,
    data: latestRoadmap || null,
    error: null
  });
});

exports.generateRoadmap = asyncHandler(async (req, res) => {
  const { goal, experience, timeline } = req.body;
  const user = await userRepository.findById(req.user.userId);

  if (!user) {
    return res.status(404).json({
      success: false,
      error: "User not found."
    });
  }

  // Construct resume analysis context if resume text exists
  let resumeAnalysis = { skills: [], experience: "", career_gaps: [] };
  if (user.resume_text) {
    try {
      resumeAnalysis = await careerService.analyzeResumeText(user.resume_text);
    } catch (e) {
      console.error("Resume analysis failed during roadmap generation:", e);
    }
  }

  const profileData = {
    role: user.role || "Developer",
    target_domain: user.target_domain || "Software Engineering",
    answers: { goal, experience, timeline }
  };

  const roadmapContent = await careerService.generatePersonalizedRoadmap(user.id, profileData, resumeAnalysis);

  const createdRoadmap = await roadmapRepository.createRoadmap(
    user.id,
    goal,
    roadmapContent
  );

  res.json({
    success: true,
    data: createdRoadmap,
    error: null
  });
});