const aiService = require("../services/aiService");

exports.startInterview = async (req, res) => {

  try {

    const question = await aiService.generateInterviewQuestion();

    res.json({
      question
    });

  } catch (error) {

    res.status(500).json({
      error: error.message
    });

  }
};

exports.submitAnswer = async (req, res) => {

  try {

    const { question, userCode } = req.body;

    const feedback =
      await aiService.evaluateInterviewAnswer(
        question,
        userCode
      );

    res.json({
      feedback
    });

  } catch (error) {

    res.status(500).json({
      error: error.message
    });

  }
};