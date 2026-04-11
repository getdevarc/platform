const careerService = require("../services/careerService");
const userRepository = require("../repositories/userRepository");
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
  await userRepository.updateUser(req.user.id, {
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
  await userRepository.updateUser(req.user.id, {
    role,
    target_domain,
    career_answers: Array.isArray(answers) ? JSON.stringify(answers) : answers
  });

  // Fetch updated user to get resume context
  const user = await userRepository.findById(req.user.id);
  
  // Generate Roadmap if resume text exists
  let roadmap = "Complete your resume upload to generate a personalized roadmap.";
  if (user.resume_text) {
     try {
       // Re-analyze the stored text directly
       const analysisResults = await careerService.analyzeResumeText(user.resume_text);
       roadmap = await careerService.generatePersonalizedRoadmap(user.id, { role, target_domain, answers }, analysisResults);
       
       await userRepository.updateUser(user.id, {
          career_roadmap: roadmap
       });
     } catch (e) {
       console.error("Roadmap generation failed during onboarding:", e);
     }
  }

  res.json({
    success: true,
    data: { 
      message: "Onboarding completed successfully.",
      roadmap: roadmap 
    },
    error: null
  });
});