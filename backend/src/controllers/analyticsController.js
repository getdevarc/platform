const sessionService = require("../services/sessionService");
const asyncHandler = require("../utils/asyncHandler");

exports.getDashboardStats = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const history = await sessionService.getUserHistory(userId);
  
  // Calculate basic stats for MVP
  const totalSolved = history.length;
  // Mocking 4-day streak for now until we add a dedicated logic
  const streak = totalSolved > 0 ? "4 Days" : "0 Days"; 
  const accuracy = totalSolved > 0 ? "84%" : "0%";

  res.json({
    success: true,
    data: {
      stats: [
        { name: "Solved Problems", value: totalSolved.toString(), color: "text-green-500" },
        { name: "Current Streak", value: streak, color: "text-orange-500" },
        { name: "Accuracy", value: accuracy, color: "text-blue-500" },
      ],
      recentInsights: history.slice(0, 5)
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
