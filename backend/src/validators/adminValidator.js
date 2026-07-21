const { z } = require("zod");

exports.updateUserRoleSchema = z.object({
    role: z.enum(["user", "admin"])
});

exports.createTrackSchema = z.object({
    title: z.string().min(3),
    description: z.string().min(5),
    difficulty: z.enum(["beginner", "intermediate", "advanced"]),
    estimated_hours: z.number().int().positive()
});

exports.upsertCurationSchema = z.object({
    title: z.string().min(2),
    category: z.string().min(2),
    reason: z.string().min(5),
    url: z.string().url().nullable().optional()
});

exports.createPageSchema = z.object({
    title: z.string().min(2),
    slug: z.string().min(2)
});

exports.updatePageSchema = z.object({
    title: z.string().min(2),
    slug: z.string().min(2),
    status: z.enum(["DRAFT", "REVIEW", "PUBLISHED", "ARCHIVED"]),
    display_order: z.number().int().nonnegative(),
    difficulty: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]),
    estimated_minutes: z.number().int().nonnegative().optional(),
    learning_objectives: z.string().optional().default(""),
    code_snippets: z.string().optional().default(""),
    best_practices: z.string().optional().default(""),
    common_mistakes: z.string().optional().default(""),
    real_world_examples: z.string().optional().default(""),
    summary: z.string().optional().default(""),
    prerequisites: z.string().optional().default(""),
    previous_page_id: z.string().uuid().nullable().optional(),
    next_page_id: z.string().uuid().nullable().optional()
});

exports.reorderPagesSchema = z.object({
    orders: z.array(z.object({
        id: z.string().uuid(),
        display_order: z.number().int().nonnegative()
    }))
});

exports.reorderModulesSchema = z.object({
    orders: z.array(z.object({
        id: z.string().uuid(),
        sort_order: z.number().int().nonnegative()
    }))
});

exports.createResourceSchema = z.object({
    title: z.string({ required_error: "Title is required" })
        .trim()
        .min(1, "Title cannot be empty"),
    url: z.string({ required_error: "URL is required" })
        .trim()
        .url("Invalid URL format. Must start with http:// or https://")
        .refine(val => val.startsWith("http://") || val.startsWith("https://"), {
            message: "URL must start with http:// or https:// protocol"
        }),
    provider: z.string({ required_error: "Provider is required" })
        .trim()
        .min(1, "Provider cannot be empty"),
    type: z.enum([
        'Official Documentation', 'Article', 'Video', 'GitHub', 'Book', 'Course', 'Cheat Sheet', 'Practice', 'Other'
    ], {
        errorMap: () => ({ message: "Invalid resource type selected" })
    }),
    description: z.string().optional().default(""),
    reason: z.string().optional().default(""),
    difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional().default("beginner"),
    is_official: z.boolean().optional().default(false),
    status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional().default("PUBLISHED"),
    tags: z.array(z.string()).optional().default([]),
    display_order: z.number().int().nonnegative().optional().default(1)
});

exports.updateResourceSchema = z.object({
    title: z.string({ required_error: "Title is required" })
        .trim()
        .min(1, "Title cannot be empty"),
    url: z.string({ required_error: "URL is required" })
        .trim()
        .url("Invalid URL format. Must start with http:// or https://")
        .refine(val => val.startsWith("http://") || val.startsWith("https://"), {
            message: "URL must start with http:// or https:// protocol"
        }),
    provider: z.string({ required_error: "Provider is required" })
        .trim()
        .min(1, "Provider cannot be empty"),
    type: z.enum([
        'Official Documentation', 'Article', 'Video', 'GitHub', 'Book', 'Course', 'Cheat Sheet', 'Practice', 'Other'
    ], {
        errorMap: () => ({ message: "Invalid resource type selected" })
    }),
    description: z.string().optional().default(""),
    reason: z.string().optional().default(""),
    difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional().default("beginner"),
    is_official: z.boolean().optional().default(false),
    status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional().default("PUBLISHED"),
    tags: z.array(z.string()).optional().default([]),
    display_order: z.number().int().nonnegative().optional().default(1)
});


