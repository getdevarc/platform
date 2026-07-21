const Groq = require("groq-sdk");
const aiLogRepository = require("../repositories/aiLogRepository");

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

/**
 * Generate modular study guides using Groq LLM model
 */
exports.generateModuleContent = async (userId, trackTitle, moduleTitle) => {
    const prompt = `You are an expert software engineering mentor. Create comprehensive, structured, and deep educational content for:
Module Title: ${moduleTitle}
Learning Track: ${trackTitle}

The output must be formatted as clean, raw Markdown.
Do NOT include any introductory or concluding conversational text (e.g. "Sure, here is...", or "Hope this helps!"). Start directly with the content.

You MUST include the following 14 sections in this exact order:
1. Overview: High-level overview of the module content. Keep it professional and concise.
2. Learning Objectives: Clear bullet points of concrete concepts a student will master.
3. When should you use this?: Guide the student on when this specific architecture or solution is appropriate for production systems.
4. Production Tip: A concise engineering tip highlighting one critical production best practice for this topic.
5. Core Concepts: In-depth, production-oriented technical explanations of the fundamental concepts.
6. Key Terminology: Definitions of essential terms and jargon.
7. Step-by-step Explanation: A detailed, step-by-step breakdown of how these concepts operate or are built under the hood. Support with logical code structures or flows where helpful.
8. Best Practices: Practical engineering dos and industry standard protocols.
9. Common Mistakes: Real-world pitfalls and typical anti-patterns.
10. Real-world Examples: Practical case studies, production scenarios, or code architectures.
11. Estimated Study Time: Give a reasonable time estimation (e.g., 2-3 hours) for this module.
12. Summary: A concise wrap-up of the key takeaways.
13. Further Reading: Recommend 2-4 carefully selected books, official documentation specs, or high-quality articles. Do NOT place raw links or hyperlink URLs (like https://...) anywhere in this section or in other parts of the Study Guide. Format each item strictly as:
    - Resource Name - Short reason why it is useful
14. Next Steps: A guidance statement directing the learner to logical concrete actions (e.g. read resources, continue to the next module).

Quality Guidelines:
- Avoid generic overview explanations. Provide direct, production-focused engineering insights and interview-relevant contexts.
- Formatting rules: Use standard Markdown headings (#, ##, ###). Do NOT escape markdown characters (like \\# or \\*). Use syntax highlighted code blocks for code snippets.
`;

    const response = await groq.chat.completions.create({
        model: "llama-3.1-8b-instant",
        messages: [
            { role: "system", content: "You are a professional software development coach specializing in technical training." },
            { role: "user", content: prompt }
        ]
    });

    const content = response.choices[0].message.content || "";

    // Log in AI logs for auditability. We check if aiLogRepository exists and supports log fields.
    try {
        await aiLogRepository.createLog({
            userId,
            prompt,
            response: content
        });
    } catch (logErr) {
        console.error("AI logging skipped/failed:", logErr.message);
    }

    return content;
};

/**
 * Generate subpage-level study guides using Groq LLM model
 */
exports.generatePageContent = async (userId, trackTitle, moduleTitle, pageTitle) => {
    const prompt = `You are an expert software engineering mentor. Create comprehensive, structured, and deep educational content for:
Page/Topic: ${pageTitle}
Module (Chapter): ${moduleTitle}
Learning Track: ${trackTitle}

The output must be formatted as clean, raw Markdown.
Do NOT include any introductory or concluding conversational text (e.g. "Sure, here is...", or "Hope this helps!"). Start directly with the content.

You MUST include the following 14 sections in this exact order:
1. Overview: High-level overview of this page's topic. Keep it professional and concise.
2. Learning Objectives: Clear bullet points of concrete concepts a student will master on this page.
3. When should you use this?: Guide the student on when this specific architecture or solution is appropriate for production systems.
4. Production Tip: A concise engineering tip highlighting one critical production best practice for this topic.
5. Core Concepts: In-depth, production-oriented technical explanations of the fundamental concepts.
6. Key Terminology: Definitions of essential terms and jargon.
7. Step-by-step Explanation: A detailed, step-by-step breakdown of how these concepts operate or are built under the hood. Support with logical code structures or flows where helpful.
8. Best Practices: Practical engineering dos and industry standard protocols.
9. Common Mistakes: Real-world pitfalls and typical anti-patterns.
10. Real-world Examples: Practical case studies, production scenarios, or code architectures.
11. Estimated Study Time: Give a reasonable time estimation (e.g., 30-45 minutes) for this page.
12. Summary: A concise wrap-up of the key takeaways.
13. Further Reading: Recommend 2-4 carefully selected books, official documentation specs, or high-quality articles. Do NOT place raw links or hyperlink URLs (like https://...) anywhere in this section or in other parts of the Study Guide. Format each item strictly as:
    - Resource Name - Short reason why it is useful
14. Next Steps: A guidance statement directing the learner to logical concrete actions (e.g. read resources, continue to the next page).

Quality Guidelines:
- Avoid generic overview explanations. Provide direct, production-focused engineering insights and interview-relevant contexts.
- Formatting rules: Use standard Markdown headings (#, ##, ###). Do NOT escape markdown characters (like \\# or \\*). Use syntax highlighted code blocks for code snippets.
`;

    const response = await groq.chat.completions.create({
        model: "llama-3.1-8b-instant",
        messages: [
            { role: "system", content: "You are a professional software development coach specializing in technical training." },
            { role: "user", content: prompt }
        ]
    });

    const content = response.choices[0].message.content || "";

    try {
        await aiLogRepository.createLog({
            userId,
            prompt,
            response: content
        });
    } catch (logErr) {
        console.error("AI logging skipped/failed:", logErr.message);
    }

    return content;
};


/**
 * Generate structural lesson content JSON draft for CMS admin review
 */
exports.generateCMSPageDraft = async (userId, trackTitle, moduleTitle, pageTitle) => {
    const prompt = `You are an expert software engineering mentor. Create comprehensive, structured, and deep educational database content schema properties for:
Page/Topic: ${pageTitle}
Module (Chapter): ${moduleTitle}
Learning Track: ${trackTitle}

The output must be a valid, parsed JSON object containing structured text/markdown properties representing database columns. Do NOT include any introductory or concluding conversational text.

Structure your response as a JSON object with these exact keys:
{
  "difficulty": "BEGINNER" | "INTERMEDIATE" | "ADVANCED",
  "estimated_minutes": number,
  "learning_objectives": "string (bullet points markup)",
  "markdown_content": "string (main educational text, deep explanations)",
  "code_snippets": "string (markdown code snippets syntax highlighted)",
  "best_practices": "string (markdown bullet points check)",
  "common_mistakes": "string (markdown pitfalls listing)",
  "real_world_examples": "string (markdown architectural scenario)",
  "summary": "string (bullet points overview)"
}
`;

    const response = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        response_format: { type: "json_object" },
        messages: [
            { role: "system", content: "You are a professional software development coach specializing in technical training. Return response as a JSON object." },
            { role: "user", content: prompt }
        ]
    });

    const rawJson = response.choices[0].message.content || "{}";

    try {
        await aiLogRepository.createLog({
            userId,
            prompt,
            response: rawJson
        });
    } catch (logErr) {
        console.error("AI logging failed:", logErr.message);
    }

    try {
        return JSON.parse(rawJson);
    } catch (err) {
        console.error("Failed to parse JSON AI draft:", err);
        return {
            difficulty: "BEGINNER",
            estimated_minutes: 15,
            learning_objectives: "• Understand " + pageTitle,
            markdown_content: "Draft generation completed. Review details.",
            code_snippets: "// Code example template",
            best_practices: "• Best practice item",
            common_mistakes: "• Common mistake item",
            real_world_examples: "Architectural scenario description",
            summary: "Review summary"
        };
    }
};


