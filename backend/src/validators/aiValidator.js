const { z } = require("zod");

exports.hintSchema = z.object({
  problemId: z.string().uuid(),
  userCode: z.string().min(1)
});

exports.explainSchema = z.object({
  problemId: z.string().uuid(),
  userCode: z.string().min(1)
});

exports.reviewSchema = z.object({
  problemId: z.string().uuid(),
  userCode: z.string().min(1)
});