const sessionService = require("../services/sessionService");
const interviewRepository = require("../repositories/interviewRepository");
const asyncHandler = require("../utils/asyncHandler");
const db = require("../config/db");

exports.getDashboardStats = asyncHandler(async (req, res) => {
  const userId = req.user.userId;

  // Retrieve user's submissions
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

    // Add to attempts
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

  res.json({
    success: true,
    data: {
      stats: [
        { name: "Solved Problems", value: totalSolved.toString(), color: "text-[var(--primary)]" },
        { name: "Current Streak", value: `${streakVal} Days`, color: "text-orange-500" },
        { name: "Accuracy", value: `${accuracyVal}%`, color: "text-emerald-500" },
        { name: "Avg Interview", value: completedInterviews.length > 0 ? `${averageScore}%` : "N/A", color: "text-blue-500" }
      ],
      recentInsights: history,
      skillMastery: skillMastery
    },
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
