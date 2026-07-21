const sessionService = require("../services/sessionService");
const interviewRepository = require("../repositories/interviewRepository");
const asyncHandler = require("../utils/asyncHandler");
const db = require("../config/db");
const cache = require("../utils/cache");

exports.getDashboardStats = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const cacheKey = `user:${userId}:dashboard`;

  const cachedData = await cache.get(cacheKey);
  if (cachedData) {
    return res.json({
      success: true,
      data: cachedData,
      error: null
    });
  }

  // 1. Fetch user detail
  const userResult = await db.query(
    "SELECT id, role, target_domain, career_answers FROM users WHERE id = $1",
    [userId]
  );
  if (userResult.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: "User not found."
    });
  }
  const user = userResult.rows[0];

  // 2. Retrieve user's submissions
  const subResult = await db.query(
    `SELECT * FROM submissions WHERE user_id=$1`,
    [userId]
  );
  const submissions = subResult.rows;

  // Calculate unique solved problem IDs (status = 'accepted')
  const solvedProblemIds = new Set(
    submissions.filter(s => s.status === 'accepted').map(s => s.problem_id)
  );
  const totalSolved = solvedProblemIds.size;

  // Calculate current streak
  const uniqueDates = Array.from(
    new Set(submissions.map(s => new Date(s.created_at).toDateString()))
  );
  let streakVal = 0;
  let currentWordDate = new Date();
  while (true) {
    if (uniqueDates.includes(currentWordDate.toDateString())) {
      streakVal++;
      currentWordDate.setDate(currentWordDate.getDate() - 1);
    } else {
      break;
    }
  }
  if (streakVal === 0) {
    let yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    currentWordDate = yesterday;
    while (true) {
      if (uniqueDates.includes(currentWordDate.toDateString())) {
        streakVal++;
        currentWordDate.setDate(currentWordDate.getDate() - 1);
      } else {
        break;
      }
    }
  }

  // Calculate accuracy percentage
  const completedSubmissions = submissions.filter(s => s.total_cases > 0);
  let accuracyVal = 0;
  if (completedSubmissions.length > 0) {
    const totalPassed = completedSubmissions.reduce((acc, curr) => acc + (curr.passed_cases || 0), 0);
    const totalCases = completedSubmissions.reduce((acc, curr) => acc + (curr.total_cases || 0), 0);
    accuracyVal = totalCases > 0 ? Math.round((totalPassed / totalCases) * 100) : 0;
  }

  // Retrieve mastery counts aggregated by language
  const skillQuery = await db.query(
    `SELECT language, COUNT(DISTINCT problem_id) as count
     FROM submissions
     WHERE user_id = $1 AND status = 'accepted'
     GROUP BY language`,
    [userId]
  );
  const skillMastery = skillQuery.rows.map(row => ({
    language: row.language,
    count: parseInt(row.count, 10)
  }));

  // Group submissions by problem_id for insights feed
  const problemGroupMap = {};
  submissions.forEach(s => {
    if (!problemGroupMap[s.problem_id]) {
      problemGroupMap[s.problem_id] = {
        problem_id: s.problem_id,
        problem_title: "",
        problem_difficulty: "",
        solved_count: 0,
        languages: [],
        attempts: []
      };
    }

    problemGroupMap[s.problem_id].attempts.push({
      id: s.id,
      language: s.language,
      passed_cases: s.passed_cases,
      total_cases: s.total_cases,
      status: s.status,
      created_at: s.created_at,
      score: s.score || 0
    });

    if (s.status === 'accepted') {
      problemGroupMap[s.problem_id].solved_count++;
      if (!problemGroupMap[s.problem_id].languages.includes(s.language)) {
        problemGroupMap[s.problem_id].languages.push(s.language);
      }
    }
  });

  const problemKeys = Object.keys(problemGroupMap);
  if (problemKeys.length > 0) {
    const problemsResult = await db.query(
      `SELECT id, title, difficulty FROM problems WHERE id = ANY($1)`,
      [problemKeys]
    );
    problemsResult.rows.forEach(p => {
      if (problemGroupMap[p.id]) {
        problemGroupMap[p.id].problem_title = p.title;
        problemGroupMap[p.id].problem_difficulty = p.difficulty;
      }
    });
  }

  const history = Object.values(problemGroupMap)
    .filter(g => g.problem_title)
    .map(g => {
      g.attempts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      const latestAttempt = g.attempts[0];
      return {
        id: latestAttempt.id,
        problem_id: g.problem_id,
        problem_title: g.problem_title,
        problem_difficulty: g.problem_difficulty,
        solved_count: g.solved_count,
        languages: g.languages.length > 0 ? g.languages : [latestAttempt.language],
        status: latestAttempt.status,
        created_at: latestAttempt.created_at,
        analysis_text: `Attempted in ${latestAttempt.language}. Correctness rate is ${latestAttempt.total_cases > 0 ? Math.round((latestAttempt.passed_cases / latestAttempt.total_cases) * 100) : 0}% by executing ${latestAttempt.passed_cases} out of ${latestAttempt.total_cases} validation constraints.`,
        strengths: [`Score: ${latestAttempt.score || 0}`, `${latestAttempt.passed_cases}/${latestAttempt.total_cases} Cases`],
        attempts: g.attempts
      };
    });

  const interviews = await interviewRepository.getUserInterviews(userId);
  const completedInterviews = interviews.filter(i => i.status === 'completed' && i.evaluation);
  let averageScore = 0;
  if (completedInterviews.length > 0) {
    const totalScore = completedInterviews.reduce((acc, curr) => acc + (curr.evaluation.totalScore || 0), 0);
    averageScore = Math.round(totalScore / completedInterviews.length);
  }

  const roadmapsResult = await db.query(
    `SELECT COUNT(*) as count FROM roadmaps WHERE user_id = $1`,
    [userId]
  );
  const roadmapCount = parseInt(roadmapsResult.rows[0].count, 10);

  // ----------------------------------------------------
  // Phase 5 Connected Learning & Extensible Stats Addition
  // ----------------------------------------------------

  // Fetch count of active track enrollments
  const activeTracksRes = await db.query(
    "SELECT COUNT(*) as count FROM user_enrolled_tracks WHERE user_id = $1 AND status = 'ACTIVE'",
    [userId]
  );
  const activeTracksCount = parseInt(activeTracksRes.rows[0].count, 10);

  // Fetch count of completed topics
  const topicsCompletedRes = await db.query(
    "SELECT COUNT(*) as count FROM user_module_content WHERE user_id = $1",
    [userId]
  );
  const topicsCompleted = parseInt(topicsCompletedRes.rows[0].count, 10);

  // Fetch estimated study hours based on estimated_hours of active tracks
  const hoursRes = await db.query(
    `SELECT COALESCE(SUM(lt.estimated_hours), 0) as hours
     FROM user_enrolled_tracks uet
     JOIN learning_tracks lt ON uet.track_id = lt.id
     WHERE uet.user_id = $1 AND uet.status = 'ACTIVE'`,
    [userId]
  );
  const totalEstimatedStudyHours = parseInt(hoursRes.rows[0].hours, 10);

  // Fetch overall progress percentage of active tracks
  const progressRes = await db.query(
    `SELECT 
       COALESCE(COUNT(lm.id), 0) as total_modules,
       COALESCE(COUNT(umc.module_id), 0) as completed_modules
     FROM user_enrolled_tracks uet
     JOIN learning_modules lm ON uet.track_id = lm.track_id
     LEFT JOIN user_module_content umc ON lm.id = umc.module_id AND umc.user_id = $1
     WHERE uet.user_id = $1 AND uet.status = 'ACTIVE'`,
    [userId]
  );
  const totalModules = parseInt(progressRes.rows[0].total_modules, 10);
  const completedModules = parseInt(progressRes.rows[0].completed_modules, 10);
  const overallProgressPercent = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;

  // Retrieve Continue Learning: most recently accessed module study guide
  let continueLearning = null;
  const recentContentRes = await db.query(
    `SELECT umc.module_id, umc.updated_at, lm.title as module_title, lt.title as track_title, lt.slug as track_slug, lt.id as track_id
     FROM user_module_content umc
     JOIN learning_modules lm ON umc.module_id = lm.id
     JOIN learning_tracks lt ON lm.track_id = lt.id
     WHERE umc.user_id = $1
     ORDER BY umc.updated_at DESC
     LIMIT 1`,
    [userId]
  );

  let currentTrackId = null;
  if (recentContentRes.rows.length > 0) {
    const row = recentContentRes.rows[0];
    currentTrackId = row.track_id;
    continueLearning = {
      trackTitle: row.track_title,
      trackSlug: row.track_slug,
      moduleTitle: row.module_title,
      moduleId: row.module_id
    };
  } else {
    // Default to the first module of the user's first active enrolled track if they have no generated modules yet
    const fallbackModuleRes = await db.query(
      `SELECT lt.id as track_id, lt.title as track_title, lt.slug as track_slug, lm.id as module_id, lm.title as module_title
       FROM user_enrolled_tracks uet
       JOIN learning_tracks lt ON uet.track_id = lt.id
       JOIN learning_modules lm ON lt.id = lm.track_id
       WHERE uet.user_id = $1 AND uet.status = 'ACTIVE'
       ORDER BY uet.enrolled_at DESC, lm.sort_order ASC
       LIMIT 1`,
      [userId]
    );

    if (fallbackModuleRes.rows.length > 0) {
      const row = fallbackModuleRes.rows[0];
      currentTrackId = row.track_id;
      continueLearning = {
        trackTitle: row.track_title,
        trackSlug: row.track_slug,
        moduleTitle: row.module_title,
        moduleId: row.module_id
      };
    }
  }

  // If a track context is identified, compute specific progress metrics
  if (continueLearning && currentTrackId) {
    const trackProgressRes = await db.query(
      `SELECT 
         COALESCE(COUNT(lm.id), 0) as total,
         COALESCE(COUNT(umc.module_id), 0) as completed
       FROM learning_modules lm
       LEFT JOIN user_module_content umc ON lm.id = umc.module_id AND umc.user_id = $1
       WHERE lm.track_id = $2`,
      [userId, currentTrackId]
    );
    const trackTotal = parseInt(trackProgressRes.rows[0].total, 10);
    const trackCompleted = parseInt(trackProgressRes.rows[0].completed, 10);

    continueLearning.progressPercent = trackTotal > 0 ? Math.round((trackCompleted / trackTotal) * 100) : 0;
    // Estimate 45 minutes of reading per remaining module study guide
    continueLearning.estimatedRemainingMinutes = (trackTotal - trackCompleted) * 45;
  }

  // Career Milestone queries
  let careerProgress = null;
  const milestoneCountRes = await db.query(
    `SELECT 
       COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed,
       COUNT(*) as total
     FROM roadmap_steps
     WHERE user_id = $1`,
    [userId]
  );
  const stepsTotal = parseInt(milestoneCountRes.rows[0].total, 10);
  const stepsCompleted = parseInt(milestoneCountRes.rows[0].completed, 10);

  const activeMilestoneRes = await db.query(
    `SELECT title, status FROM roadmap_steps
     WHERE user_id = $1 AND status IN ('IN_PROGRESS', 'NOT_STARTED')
     ORDER BY sort_order ASC
     LIMIT 1`,
    [userId]
  );

  careerProgress = {
    targetDomain: user.target_domain || "Software Engineering",
    roadmapProgressPercent: stepsTotal > 0 ? Math.round((stepsCompleted / stepsTotal) * 100) : 0,
    currentMilestone: activeMilestoneRes.rows.length > 0 ? {
      title: activeMilestoneRes.rows[0].title,
      status: activeMilestoneRes.rows[0].status
    } : null
  };

  // Today's Focus Widget Concept
  let focus = null;
  if (continueLearning) {
    focus = {
      title: continueLearning.moduleTitle,
      category: `${continueLearning.trackTitle} module`,
      link: `/learn/${continueLearning.trackSlug}?module=${continueLearning.moduleId}`,
      actionLabel: "Resume Study"
    };
  } else {
    // If not enrolled in anything, recommend enrolling first
    focus = {
      title: "Join your first learning track",
      category: "Onboarding Target",
      link: "/learn",
      actionLabel: "Browse Tracks"
    };
  }

  // Generic, Action-Based AI Recommendation
  // Allows the future AI Coach to customize actions & paths dynamically
  let recommendation = {
    actionText: "Set up your onboarding target domain roadmap, or select an engineering learning track to unlock skill progress analytics.",
    actionType: "BROWSE_TRACKS",
    metadata: {}
  };

  if (user.target_domain) {
    recommendation = {
      actionText: `Practice problems or mock interviews targeting your '${user.target_domain}' gaps to boost readiness score.`,
      actionType: "START_INTERVIEW",
      metadata: { target_domain: user.target_domain }
    };
  }

  if (continueLearning) {
    recommendation = {
      actionText: `Advance through the active module '${continueLearning.moduleTitle}' in '${continueLearning.trackTitle}' to maintain your calendar learning rhythm.`,
      actionType: "RESUME_LEARNING",
      metadata: {
        trackSlug: continueLearning.trackSlug,
        moduleId: continueLearning.moduleId
      }
    };
  }

  // Heatmap Calendar and Difficulty Breakdown queries
  const submissionsGroupRes = await db.query(
    `SELECT 
       s.created_at::date as date,
       COUNT(CASE WHEN s.status = 'accepted' THEN 1 END)::int as accepted,
       COUNT(CASE WHEN s.status != 'accepted' THEN 1 END)::int as rejected,
       COUNT(CASE WHEN p.difficulty = 'easy' AND s.status = 'accepted' THEN 1 END)::int as easy,
       COUNT(CASE WHEN p.difficulty = 'medium' AND s.status = 'accepted' THEN 1 END)::int as medium,
       COUNT(CASE WHEN p.difficulty = 'hard' AND s.status = 'accepted' THEN 1 END)::int as hard
     FROM submissions s
     LEFT JOIN problems p ON s.problem_id = p.id
     WHERE s.user_id = $1 AND s.created_at >= NOW() - INTERVAL '365 days'
     GROUP BY s.created_at::date`,
    [userId]
  );

  const modulesGroupRes = await db.query(
    `SELECT 
       created_at::date as date,
       COUNT(*)::int as count
     FROM user_module_content
     WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '365 days'
     GROUP BY created_at::date`,
    [userId]
  );

  const sessionsGroupRes = await db.query(
    `SELECT 
       created_at::date as date,
       COUNT(*)::int as count
     FROM solve_sessions
     WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '365 days'
     GROUP BY created_at::date`,
    [userId]
  );

  const dailyActivity = {};

  submissionsGroupRes.rows.forEach(r => {
    const dStr = new Date(r.date).toISOString().split('T')[0];
    dailyActivity[dStr] = {
      date: dStr,
      submissions: r.accepted + r.rejected,
      accepted: r.accepted,
      easy: r.easy,
      medium: r.medium,
      hard: r.hard,
      modules: 0,
      sessions: 0,
      totalCount: r.accepted + r.rejected
    };
  });

  modulesGroupRes.rows.forEach(r => {
    const dStr = new Date(r.date).toISOString().split('T')[0];
    if (!dailyActivity[dStr]) {
      dailyActivity[dStr] = {
        date: dStr,
        submissions: 0,
        accepted: 0,
        easy: 0,
        medium: 0,
        hard: 0,
        modules: 0,
        sessions: 0,
        totalCount: 0
      };
    }
    dailyActivity[dStr].modules = r.count;
    dailyActivity[dStr].totalCount += r.count;
  });

  sessionsGroupRes.rows.forEach(r => {
    const dStr = new Date(r.date).toISOString().split('T')[0];
    if (!dailyActivity[dStr]) {
      dailyActivity[dStr] = {
        date: dStr,
        submissions: 0,
        accepted: 0,
        easy: 0,
        medium: 0,
        hard: 0,
        modules: 0,
        sessions: 0,
        totalCount: 0
      };
    }
    dailyActivity[dStr].sessions = r.count;
    dailyActivity[dStr].totalCount += 1; // Count each active day session as 1 trigger
  });

  const activityCalendar = Object.values(dailyActivity);

  const solvedDifficultyRes = await db.query(
    `SELECT p.difficulty, COUNT(DISTINCT s.problem_id) as count
     FROM submissions s
     JOIN problems p ON s.problem_id = p.id
     WHERE s.user_id = $1 AND s.status = 'accepted'
     GROUP BY p.difficulty`,
    [userId]
  );

  const difficultyBreakdown = { easy: 0, medium: 0, hard: 0 };
  solvedDifficultyRes.rows.forEach(r => {
    if (r.difficulty === 'easy' || r.difficulty === 'medium' || r.difficulty === 'hard') {
      difficultyBreakdown[r.difficulty] = parseInt(r.count, 10);
    }
  });

  // Polymorphic Activity Builder (Queries various event types)
  const activities = [];

  // 1. Problem Solved activities
  const recentSubmissions = await db.query(
    `SELECT s.created_at as timestamp, p.title as problem_title, s.problem_id
     FROM submissions s
     JOIN problems p ON s.problem_id = p.id
     WHERE s.user_id = $1
     ORDER BY s.created_at DESC
     LIMIT 5`,
    [userId]
  );
  recentSubmissions.rows.forEach(r => {
    activities.push({
      type: "problem_solved",
      description: `Solved algorithm problem '${r.problem_title}'`,
      timestamp: r.timestamp,
      metadata: { problemId: r.problem_id }
    });
  });

  // 2. Track Enrollments
  const recentEnrollments = await db.query(
    `SELECT uet.enrolled_at as timestamp, lt.title as track_title, lt.slug as track_slug
     FROM user_enrolled_tracks uet
     JOIN learning_tracks lt ON uet.track_id = lt.id
     WHERE uet.user_id = $1
     ORDER BY uet.enrolled_at DESC
     LIMIT 5`,
    [userId]
  );
  recentEnrollments.rows.forEach(r => {
    activities.push({
      type: "track_enroll",
      description: `Enrolled in learning track '${r.track_title}'`,
      timestamp: r.timestamp,
      metadata: { trackSlug: r.track_slug }
    });
  });

  // 3. Module Guide generations
  const recentGuides = await db.query(
    `SELECT umc.created_at as timestamp, lm.title as module_title, lt.slug as track_slug
     FROM user_module_content umc
     JOIN learning_modules lm ON umc.module_id = lm.id
     JOIN learning_tracks lt ON lm.track_id = lt.id
     WHERE umc.user_id = $1
     ORDER BY umc.created_at DESC
     LIMIT 5`,
    [userId]
  );
  recentGuides.rows.forEach(r => {
    activities.push({
      type: "learning_start",
      description: `Generated study guide for module '${r.module_title}'`,
      timestamp: r.timestamp,
      metadata: { trackSlug: r.track_slug }
    });
  });

  // 4. Mock Interviews
  const recentInterviews = await db.query(
    `SELECT created_at as timestamp, id
     FROM interviews
     WHERE user_id = $1 AND status = 'completed'
     ORDER BY created_at DESC
     LIMIT 5`,
    [userId]
  );
  recentInterviews.rows.forEach(r => {
    const roleTitle = user.target_domain || user.role || "Software Engineer";
    activities.push({
      type: "interview_completed",
      description: `Completed AI evaluation: '${roleTitle}' Mock Session`,
      timestamp: r.timestamp,
      metadata: { interviewId: r.id }
    });
  });

  // Sort unified activity list by timestamp descending, take top 5
  activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  const recentActivityFeed = activities.slice(0, 5);

  const responseData = {
    stats: [
      { name: "Solved Problems", value: totalSolved.toString(), color: "text-[var(--primary)]" },
      { name: "Current Streak", value: `${streakVal} Days`, color: "text-orange-500" },
      { name: "Accuracy", value: `${accuracyVal}%`, color: "text-emerald-500" },
      { name: "Avg Interview", value: completedInterviews.length > 0 ? `${averageScore}%` : "N/A", color: "text-blue-500" },
      { name: "Completed Roadmaps", value: roadmapCount.toString(), color: "text-purple-500" },
      { name: "Completed Interviews", value: completedInterviews.length.toString(), color: "text-yellow-500" }
    ],
    recentInsights: history,
    skillMastery: skillMastery,
    hasRoadmap: roadmapCount > 0,

    // Extensible Phase 5 Keys
    learning: {
      activeTracksCount,
      topicsCompleted,
      totalEstimatedStudyHours,
      overallProgressPercent,
      continueLearning
    },
    career: careerProgress,
    focus,
    recommendation,
    activity: recentActivityFeed,
    activityCalendar,
    difficultyBreakdown
  };

  // Cache dashboard response for 10 minutes, tagged with user ID
  await cache.set(cacheKey, responseData, 600, [`user:${userId}`]);

  res.json({
    success: true,
    data: responseData,
    error: null
  });
});

exports.getSolveHistory = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const history = await sessionService.getUserHistory(userId);

  res.json({
    success: true,
    data: history,
    error: null
  });
});
