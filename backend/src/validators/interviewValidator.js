const { z } = require("zod");

exports.generateInterviewSchema = z.object({
    stepId: z.string().uuid(),
    difficulty: z.enum(["beginner", "intermediate", "advanced"])
});

exports.submitAnswerSchema = z.object({
    prepId: z.string().uuid(),
    userAnswer: z.string().min(5)
});
