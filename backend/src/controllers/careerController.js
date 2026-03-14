const aiService = require("../services/aiService");

exports.generateRoadmap = async (req, res) => {

  try {

    const { goal, experience, timeline } = req.body;

    const roadmap =
      await aiService.generateCareerRoadmap(
        goal,
        experience,
        timeline,
        req.user.userId
      );

    res.json({
      roadmap
    });

  } catch (error) {

    res.status(500).json({
      error: error.message
    });

  }
};