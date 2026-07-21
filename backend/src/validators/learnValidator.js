const { z } = require("zod");

exports.enrollTrackSchema = z.object({
    trackId: z.string().uuid()
});

exports.updateSessionSchema = z.object({
    pageId: z.string().uuid()
});

exports.updateProgressSchema = z.object({
    is_completed: z.boolean().optional(),
    is_bookmarked: z.boolean().optional(),
    notes: z.string().nullable().optional()
});
