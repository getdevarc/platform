const { z } = require("zod");

exports.submitCodeSchema = z.object({
  problemId: z.string().uuid(),
  code: z.string().min(1),
  language: z.string().min(2)
});