const careerService = require("../services/careerService");
const userRepository = require("../repositories/userRepository");
const roadmapRepository = require("../repositories/roadmapRepository");
const studyGuideRepository = require("../repositories/studyGuideRepository");
const asyncHandler = require("../utils/asyncHandler");
const aiService = require("../services/aiService");
const careerRepository = require("../repositories/careerRepository");
const learnRepository = require("../repositories/learnRepository");
const recommendationService = require("../services/recommendationService");
const cache = require("../utils/cache");

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

  // Update profile basic info in users table
  await userRepository.updateUser(req.user.userId, {
    role,
    target_domain,
    career_answers: Array.isArray(answers) ? JSON.stringify(answers) : answers
  });

  // Fetch updated user to get resume context mapping
  const user = await userRepository.findById(req.user.userId);

  // Generate Personalized Career Plan (Summary, timeline, high-level milestones roadmap)
  let plan = null;
  try {
    let analysisResults = { skills: [], experience: "", career_gaps: [] };
    if (user.resume_text) {
      try {
        analysisResults = await careerService.analyzeResumeText(user.resume_text);
      } catch (err) {
        console.error("Failed to parse resume text during onboarding:", err);
      }
    }
    // Generate onboarding career roadmap structure (does NOT generate guides/resources/checklists)
    plan = await careerService.generatePersonalizedRoadmap(user.id, { role, target_domain, answers }, analysisResults);

    // Save to normalized schemas
    await careerRepository.upsertCareerPlan(user.id, plan.career_summary, plan.estimated_timeline);
    await careerRepository.createRoadmapSteps(user.id, plan.steps || []);

    // Invalidate career and dashboard cache details for this user
    await cache.invalidateByTag(`user:${user.id}`);
  } catch (e) {
    console.error("Career Plan onboarding generation failed:", e);
  }

  res.json({
    success: true,
    data: {
      message: "Onboarding completed successfully.",
      plan
    },
    error: null
  });
});

exports.getLatestRoadmap = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const cacheKey = `career:roadmap:${userId}`;

  const cachedRoadmap = await cache.get(cacheKey);
  if (cachedRoadmap) {
    return res.json({
      success: true,
      data: cachedRoadmap,
      error: null
    });
  }

  const user = await userRepository.findById(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      error: "User not found."
    });
  }

  const careerPlan = await careerRepository.getCareerPlan(userId);
  const steps = await careerRepository.getRoadmapSteps(userId);

  // Dynamic recommendations matched via recommendation service
  const allTracks = await learnRepository.getAllTracks(userId);
  const matched = recommendationService.getRecommendations(user, allTracks, null);

  const responseData = {
    user: {
      role: user.role,
      target_domain: user.target_domain,
      career_answers: user.career_answers
    },
    careerPlan: careerPlan || null,
    steps: steps || [],
    recommendationData: matched
  };

  await cache.set(cacheKey, responseData, 600, [`user:${userId}`]);

  res.json({
    success: true,
    data: responseData,
    error: null
  });
});

// Deprecated or legacy manual roadmap generator wrapper
exports.generateRoadmap = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const user = await userRepository.findById(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      error: "User not found."
    });
  }

  const profileData = {
    role: user.role || "Developer",
    target_domain: user.target_domain || "Software Engineering",
    answers: user.career_answers || {}
  };

  const plan = await careerService.generatePersonalizedRoadmap(user.id, profileData, null);
  const careerPlan = await careerRepository.upsertCareerPlan(user.id, plan.career_summary, plan.estimated_timeline);
  const createdSteps = await careerRepository.createRoadmapSteps(user.id, plan.steps || []);

  res.json({
    success: true,
    data: {
      careerPlan,
      steps: createdSteps
    },
    error: null
  });
});

// GET /api/career/step-details?stepId=UUID
exports.getStepDetails = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { stepId } = req.query;

  if (!stepId) {
    return res.status(400).json({
      success: false,
      error: "stepId URL query parameter is required."
    });
  }

  const step = await careerRepository.getStepById(stepId);
  if (!step || step.user_id !== userId) {
    return res.status(404).json({
      success: false,
      error: "Roadmap step not found."
    });
  }

  // Check if study guide exists in database
  let guide = await careerRepository.getStudyGuide(userId, stepId);
  let resources = [];
  let projects = [];
  let interviewPreps = [];
  let revisionChecklist = [];

  if (guide) {
    // Restored guide exists! Let's fetch all associated structured tables
    resources = await careerRepository.getResources(stepId);
    projects = await careerRepository.getPracticeProjects(stepId);
    interviewPreps = await careerRepository.getInterviewPreps(stepId);
    revisionChecklist = await careerRepository.getRevisionChecklists(stepId);
  } else {
    // Generate lazily using AI
    console.log(`[AI] Lazy-generating step assets for milestone: "${step.title}"`);
    const user = await userRepository.findById(userId);
    const goal = user.career_goals || user.target_domain || "Software Developer Roles";
    const assets = await aiService.generateLazyStepAssets(step.title, goal);

    // Save outputs in normalized database tables
    guide = await careerRepository.upsertStudyGuide(userId, stepId, step.title, assets.study_guide_markdown);
    resources = await careerRepository.saveResources(userId, stepId, assets.recommended_resources);
    projects = await careerRepository.savePracticeProjects(userId, stepId, assets.practice_projects);
    interviewPreps = await careerRepository.saveInterviewPreps(userId, stepId, assets.interview_preps);
    revisionChecklist = await careerRepository.saveRevisionChecklists(userId, stepId, assets.revision_checklist);
  }

  res.json({
    success: true,
    data: {
      guide,
      resources,
      projects,
      interviewPreps,
      revisionChecklist
    },
    error: null
  });
});

// POST /api/career/study-guide/regenerate
exports.regenerateStepDetails = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { stepId } = req.body;

  if (!stepId) {
    return res.status(400).json({
      success: false,
      error: "stepId in body is required."
    });
  }

  const step = await careerRepository.getStepById(stepId);
  if (!step || step.user_id !== userId) {
    return res.status(404).json({
      success: false,
      error: "Roadmap step not found."
    });
  }

  console.log(`[AI] Regenerating details for milestone: "${step.title}"`);
  const user = await userRepository.findById(userId);
  const goal = user.career_goals || user.target_domain || "Software Developer Roles";
  const assets = await aiService.generateLazyStepAssets(step.title, goal);

  const guide = await careerRepository.upsertStudyGuide(userId, stepId, step.title, assets.study_guide_markdown);
  const resources = await careerRepository.saveResources(userId, stepId, assets.recommended_resources);
  const projects = await careerRepository.savePracticeProjects(userId, stepId, assets.practice_projects);
  const interviewPreps = await careerRepository.saveInterviewPreps(userId, stepId, assets.interview_preps);
  const revisionChecklist = await careerRepository.saveRevisionChecklists(userId, stepId, assets.revision_checklist);

  res.json({
    success: true,
    data: {
      guide,
      resources,
      projects,
      interviewPreps,
      revisionChecklist
    },
    error: null
  });
});

// POST /api/career/progress/project-task
exports.updateProjectTask = asyncHandler(async (req, res) => {
  const { stepId, projectTitle, taskId, completed } = req.body;

  if (!stepId || !projectTitle || !taskId) {
    return res.status(400).json({
      success: false,
      error: "stepId, projectTitle, and taskId are required."
    });
  }

  const step = await careerRepository.getStepById(stepId);
  if (!step || step.user_id !== req.user.userId) {
    return res.status(404).json({
      success: false,
      error: "Roadmap step not found or unauthorized."
    });
  }

  const updatedProject = await careerRepository.updateProjectTask(stepId, projectTitle, taskId, !!completed);

  // Invalidate career and dashboard cache details for this user
  await cache.invalidateByTag(`user:${req.user.userId}`);

  res.json({
    success: true,
    data: updatedProject,
    error: null
  });
});

// POST /api/career/progress/revision-task
exports.updateRevisionItem = asyncHandler(async (req, res) => {
  const { stepId, title, completed } = req.body;

  if (!stepId || !title) {
    return res.status(400).json({
      success: false,
      error: "stepId and title are required."
    });
  }

  const step = await careerRepository.getStepById(stepId);
  if (!step || step.user_id !== req.user.userId) {
    return res.status(404).json({
      success: false,
      error: "Roadmap step not found or unauthorized."
    });
  }

  const updatedChecklist = await careerRepository.updateRevisionItem(stepId, title, !!completed);

  // Invalidate career and dashboard cache details for this user
  await cache.invalidateByTag(`user:${req.user.userId}`);

  res.json({
    success: true,
    data: updatedChecklist,
    error: null
  });
});

// Legacy backward-compatibility methods
exports.getStudyGuides = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const guides = await studyGuideRepository.getAllUserStudyGuides(userId);
  res.json({
    success: true,
    data: guides,
    error: null
  });
});

exports.saveStudyGuide = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { stepTitle, content } = req.body;
  const guide = await studyGuideRepository.upsertStudyGuide(userId, stepTitle, content, []);
  res.json({
    success: true,
    data: guide,
    error: null
  });
});

exports.generateStudyGuide = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { stepTitle } = req.body;
  const user = await userRepository.findById(userId);
  const goal = user.career_goals || user.target_domain || "Software Developer";
  const assets = await aiService.generateLazyStepAssets(stepTitle, goal);

  // Find step if exists, or stub
  let steps = await careerRepository.getRoadmapSteps(userId);
  let step = steps.find(s => s.title === stepTitle);
  if (!step) {
    const list = await careerRepository.createRoadmapSteps(userId, [{ title: stepTitle, status: "IN_PROGRESS", type: "skill" }]);
    step = list[0];
  }

  const guide = await careerRepository.upsertStudyGuide(userId, step.id, step.title, assets.study_guide_markdown);
  await careerRepository.saveResources(userId, step.id, assets.recommended_resources);
  await careerRepository.savePracticeProjects(userId, step.id, assets.practice_projects);
  await careerRepository.saveInterviewPreps(userId, step.id, assets.interview_preps);
  await careerRepository.saveRevisionChecklists(userId, step.id, assets.revision_checklist);

  res.json({
    success: true,
    data: guide,
    error: null
  });
});