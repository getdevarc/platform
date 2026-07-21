const Groq = require("groq-sdk");
const aiLogRepository = require("../repositories/aiLogRepository");

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

/**
 * Handle robust parsing of Groq JSON objects and lists
 */
const safeParseAIJSON = (content) => {
    try {
        let cleaned = content.trim();

        // Remove single-line comments // ... (protect http:// and https://)
        cleaned = cleaned.replace(/(?<!:)\/\/.*/g, "");

        // Remove multi-line comments /* ... */
        cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, "");
        // Remove trailing commas before closing brackets/braces
        cleaned = cleaned.replace(/,(\s*[\]\}])/g, "$1");

        try {
            const parsed = JSON.parse(cleaned);
            if (parsed && Array.isArray(parsed)) {
                return parsed;
            }
            if (parsed && Array.isArray(parsed.resources)) {
                return parsed.resources;
            }
            return [];
        } catch (e) {
            // Fallback: search for first { or [ and match accordingly
            const braceMatch = cleaned.match(/\{[\s\S]*\}/);
            if (braceMatch) {
                const parsedVal = JSON.parse(braceMatch[0]);
                if (parsedVal && Array.isArray(parsedVal.resources)) {
                    return parsedVal.resources;
                }
            }
            const bracketMatch = cleaned.match(/\[[\s\S]*\]/);
            if (bracketMatch) {
                const parsedArr = JSON.parse(bracketMatch[0]);
                if (Array.isArray(parsedArr)) {
                    return parsedArr;
                }
            }
            throw e;
        }
    } catch (error) {
        console.error("AI JSON Parse Error (using empty array fallback):", error, "Content:", content);
        return [];
    }
};

/**
 * Generate modular resources lists using Groq LLM model
 */
exports.generateModuleResources = async (userId, trackTitle, moduleTitle) => {
    const prompt = `
You are an expert developer. Suggest 3-5 high-quality, practical learning resource references for:
Module Title: ${moduleTitle}
Learning Track: ${trackTitle}

You must output a raw JSON object containing a "resources" key with the list of resource references. Do not include any markup, intro, ending, or explainers.

Response Format:
{
  "resources": [
    {
      "id": "res-1",
      "title": "Resource Title",
      "category": "Official Documentation",
      "reason": "Detailed explanation of suitability",
      "difficulty": "Beginner",
      "url": "https://react.dev/learn",
      "is_official": true,
      "source_name": "Official React Docs Team",
      "is_bookmarked": false,
      "is_completed": false,
      "additional_metadata": {}
    }
  ]
}

Quality Constraints:
- Supported categories: "Official Documentation", "GitHub Repository", "Article", "Blog", "Book", "YouTube", "Course".
- Prioritize resources in the following order:
  1. Official Documentation
  2. MDN
  3. Microsoft Learn
  4. Official GitHub repositories
  5. Well-known books
  6. High-quality YouTube channels
  7. W3Schools (only as an additional beginner resource where appropriate)
- Url validation rule: The "url" value MUST be either a valid, active absolute URL string starting with "https://", or the literal value null (without quotes). Do NOT output partial URLs (like "https:"), unclosed strings, or placeholders. If you are not completely confident about the exact link, use null. Prefer providing highly correct and exact titles/source names for resources so they can be identified, rather than hallucinating broken hyperlink URLs.


`;

    const response = await groq.chat.completions.create({
        model: "llama-3.1-8b-instant",
        response_format: { type: "json_object" },
        messages: [
            { role: "system", content: "You are a professional software engineering advisor that suggests study resources strictly in valid JSON format." },
            { role: "user", content: prompt }
        ]
    });

    const rawText = response.choices[0].message.content || "{}";
    const parsedResources = safeParseAIJSON(rawText);

    // Log in AI logs for auditability
    try {
        await aiLogRepository.createLog({
            userId,
            prompt,
            response: rawText
        });
    } catch (logErr) {
        console.error("AI resource logging failed:", logErr.message);
    }

    return parsedResources;
};

/**
 * Generate subpage-level resources lists using Groq LLM model
 */
exports.generatePageResources = async (userId, trackTitle, moduleTitle, pageTitle) => {
    const prompt = `
You are an expert developer. Suggest 3-5 high-quality, practical learning resource references for:
Page/Topic: ${pageTitle}
Module (Chapter): ${moduleTitle}
Learning Track: ${trackTitle}

You must output a raw JSON object containing a "resources" key with the list of resource references. Do not include any markup, intro, ending, or explainers.

Response Format:
{
  "resources": [
    {
      "id": "res-1",
      "title": "Resource Title",
      "category": "Official Documentation",
      "reason": "Detailed explanation of suitability",
      "difficulty": "Beginner",
      "url": "https://react.dev/learn",
      "is_official": true,
      "source_name": "Official React Docs Team",
      "is_bookmarked": false,
      "is_completed": false,
      "additional_metadata": {}
    }
  ]
}

Quality Constraints:
- Supported categories: "Official Documentation", "GitHub Repository", "Article", "Blog", "Book", "YouTube", "Course".
- Prioritize resources in the following order:
  1. Official Documentation
  2. MDN
  3. Microsoft Learn
  4. Official GitHub repositories
  5. Well-known books
  6. High-quality YouTube channels
  7. W3Schools (only as an additional beginner resource where appropriate)
- Url validation rule: The "url" value MUST be either a valid, active absolute URL string starting with "https://", or the literal value null (without quotes). Do NOT output partial URLs (like "https:"), unclosed strings, or placeholders. If you are not completely confident about the exact link, use null. Prefer providing highly correct and exact titles/source names for resources so they can be identified, rather than hallucinating broken hyperlink URLs.
`;

    const response = await groq.chat.completions.create({
        model: "llama-3.1-8b-instant",
        response_format: { type: "json_object" },
        messages: [
            { role: "system", content: "You are a professional software engineering advisor that suggests study resources strictly in valid JSON format." },
            { role: "user", content: prompt }
        ]
    });

    const rawText = response.choices[0].message.content || "{}";
    const parsedResources = safeParseAIJSON(rawText);

    try {
        await aiLogRepository.createLog({
            userId,
            prompt,
            response: rawText
        });
    } catch (logErr) {
        console.error("AI resource logging failed:", logErr.message);
    }

    return parsedResources;
};


