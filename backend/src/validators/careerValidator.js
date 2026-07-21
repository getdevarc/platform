const { z } = require("zod");

exports.generatePlanSchema = z.object({
    careerGoals: z.string().min(3),
    targetDomain: z.string().min(2),
    dreamCompany: z.string().optional()
});

exports.updateStepSchema = z.object({
    status: z.enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETED"])
});
