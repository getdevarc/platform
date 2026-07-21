const Groq = require("groq-sdk");
const aiLogRepository = require("../repositories/aiLogRepository");
const eventService = require("./eventService");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

/**
 * Robustly extract and parse JSON from an AI response string.
 * Handles cases where the AI adds introductory or concluding conversational text.
 */
const safeParseAIJSON = (content) => {
  try {
    const trimmed = content.trim();
    // Try direct parse first
    try {
      return JSON.parse(trimmed);
    } catch (e) {
      // Fallback: search for first { and last }
      const match = trimmed.match(/\{[\s\S]*\}/);
      if (match) {
        return JSON.parse(match[0]);
      }
      throw e;
    }
  } catch (error) {
    console.error("AI JSON Parse Error:", error, "Content:", content);
    throw new Error("Failed to parse AI response as JSON");
  }
};

// -------- Generate Hint --------
exports.generateHint = async (problem, userCode, userId, sessionId, hintLevel = 1) => {
  const prompt = `
You are an expert DSA mentor.

Problem:
${problem.description}

User Code:
${userCode}

Hint Level: ${hintLevel} (1: nudge, 2: stronger, 3: near-solution)

Give a helpful hint that guides the user toward solving the problem based on the hint level.
`;

  const response = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [
      { role: "system", content: "You are a coding mentor specialist in DSA." },
      { role: "user", content: prompt }
    ]
  });

  const hint = response.choices[0].message.content;

  await aiLogRepository.createLog({
    userId,
    problemId: problem.id,
    prompt,
    response: hint
  });

  if (sessionId) {
    await eventService.logEvent(sessionId, "ai_hint", { hintLevel });
    const sessionRepository = require("../repositories/sessionRepository");
    await sessionRepository.deductPoints(sessionId, 20);
  }

  return hint;
};

// -------- Generate Explanation --------
exports.generateExplanation = async (problem, userCode, userId, sessionId) => {
  const prompt = `
You are an expert DSA mentor.

Problem:
${problem.description}

User Code:
${userCode}

Explain the optimal solution.

Return response in this format:

Algorithm:
Time Complexity:
Space Complexity:
Explanation:
`;

  const response = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [
      { role: "system", content: "You are a coding mentor." },
      { role: "user", content: prompt }
    ]
  });

  const explanation = response.choices[0].message.content;

  await aiLogRepository.createLog({
    userId,
    problemId: problem.id,
    prompt,
    response: explanation
  });

  if (sessionId) {
    await eventService.logEvent(sessionId, "ai_explain");
    const sessionRepository = require("../repositories/sessionRepository");
    await sessionRepository.deductPoints(sessionId, 20);
  }

  return explanation;
};

// -------- Generate Code Review --------
exports.generateCodeReview = async (problem, userCode, userId, sessionId) => {
  const prompt = `
You are an expert software engineer and DSA mentor.

Problem:
${problem.description}

User Code:
${userCode}

Analyze the user's code and provide a review.

Your response should include:

Code Correctness:
Time Complexity:
Space Complexity:
Code Quality:
Suggested Improvement:

Do NOT rewrite the entire solution.
Focus on reviewing the existing code.
`;

  const response = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [
      { role: "system", content: "You are an expert coding reviewer." },
      { role: "user", content: prompt }
    ]
  });

  const review = response.choices[0].message.content;

  await aiLogRepository.createLog({
    userId,
    problemId: problem.id,
    prompt,
    response: review
  });

  if (sessionId) {
    const eventRepository = require("../repositories/eventRepository");
    const events = await eventRepository.getEventsBySessionId(sessionId);
    const reviewCount = events.filter(e => e.event_type === "ai_review").length;

    await eventService.logEvent(sessionId, "ai_review");

    // Deduct 25 points if this is not the first review
    if (reviewCount > 0) {
      const sessionRepository = require("../repositories/sessionRepository");
      await sessionRepository.deductPoints(sessionId, 25);
    }
  }

  return review;
};

// -------- Generate Solve Insights --------
exports.generateSolveInsights = async (events, userId) => {
  if (!events || events.length === 0) {
    return {
      strengths: ["Fast problem identification"],
      weaknesses: ["No activity captured"],
      topics: ["Unknown"],
      recommended_problems: ["Two Sum", "Reverse String"],
      analysis: "User solved efficiently without assistance."
    };
  }

  const timeline = events
    .map(e => `${new Date(e.created_at).toLocaleTimeString()} - ${e.event_type}`)
    .join("\n");

  const prompt = `
You are an expert DSA mentor.

Analyze this coding session timeline:

${timeline}

Return STRICT JSON only:
{
  "strengths": ["list of strings"],
  "weaknesses": ["list of strings"],
  "topics": ["list of DSA topics relevant to this session"],
  "recommended_problems": ["titles of 2-3 similar problems"],
  "analysis": "a brief 1-2 sentence overview"
}
`;

  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: "Return ONLY strictly valid JSON. No other text." },
        { role: "user", content: prompt }
      ]
    });

    return safeParseAIJSON(response.choices[0].message.content);
  } catch (error) {
    console.error("AI Insights Error:", error);
    return {
      strengths: ["Resilience"],
      weaknesses: ["Session analysis failed"],
      topics: [],
      recommended_problems: [],
      analysis: "Could not analyze session due to AI error."
    };
  }
};

// -------- Generate Interview Question --------
exports.generateInterviewQuestion = async (type = "DSA") => {
  const prompt = `
You are a senior software engineer conducting a technical interview for the ${type} track.

Generate one challenging interview question or problem.

Include:
- Title
- Detailed Description
- Requirements (optional)
- Examples (if applicable)

Keep the response professional and suitable for a middle-to-senior software engineer level.
`;

  const response = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [
      { role: "system", content: "You are a technical interviewer." },
      { role: "user", content: prompt }
    ]
  });

  return response.choices[0].message.content;
};

// -------- Conversational Interview Message --------
exports.generateConversationalResponse = async (history, userMessage) => {
  const messages = [
    {
      role: "system",
      content: "You are a Senior Software Engineer from a Top Tech Co conducting a coding interview. Be professional, slightly challenging, but encouraging. Focus on problem-solving, edge cases, and optimization. CRITICAL: You must guide the candidate verbally by asking leading questions or hinting at complexity, but you must NEVER output, outline, or reveal any complete solution code or logic before they submit their solution using the Submit button. Keep code solutions entirely hidden."
    },
    ...history,
    { role: "user", content: userMessage }
  ];

  const response = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages
  });

  return response.choices[0].message.content;
};

// -------- Final Interview Report Card --------
exports.generateFinalInterviewReport = async (transcript, code, language) => {
  const prompt = `
Analyze this coding interview transcript and the user's latest solution code to provide a professional evaluation report.

Transcript:
${JSON.stringify(transcript)}

Candidate's Final Code (${language || "javascript"}):
\`\`\`${language || "javascript"}
${code || "// No code submitted"}
\`\`\`

CRITICAL SCORING CONSTRAINTS:
1. If the Candidate's Final Code is empty, contains only comments, or matches the placeholder boilerplate without custom user improvements solving the problem, you MUST strictly grade "totalScore", "logicScore", and "codeQualityScore" to 0 (or maximum 5 if some concepts were verbally discussed). The absolute maximum possible totalScore for this case is 10.
2. If code is present but is critically flawed, contains severe syntax errors, or fails to address the problem requirements, the "totalScore" and "logicScore" MUST NOT exceed 35.
3. Be highly critical and objective. Do not award passing scores (> 50) for incomplete, unrun, or bug-filled solutions.
4. If "totalScore" is less than 65, the feedback "verdict" MUST be "NO HIRE".

Return STRICT JSON ONLY, adhering to this structure:
{
  "totalScore": 85,
  "logicScore": 90,
  "communicationScore": 80,
  "codeQualityScore": 85,
  "overallFeedback": "Professional summary...",
  "strengths": ["list"],
  "weaknesses": ["list"],
  "verdict": "HIRE / NO HIRE / STRONG HIRE"
}
`;

  const response = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [
      { role: "system", content: "You are a technical hiring manager. Return ONLY JSON." },
      { role: "user", content: prompt }
    ]
  });

  return safeParseAIJSON(response.choices[0].message.content);
};

// -------- Consolidated Multi-Question Interview Report Card --------
exports.generateConsolidatedInterviewReport = async (transcript, completedQuestions) => {
  const prompt = `
Analyze this coding interview transcript and the collection of completed questions along with the user's submitted solutions.
Provide a consolidated ex-FAANG hiring evaluation report.

Transcript:
---
${JSON.stringify(transcript)}
---

Completed Questions & Submitted Solutions:
---
${JSON.stringify(completedQuestions)}
---

CRITICAL SCORING CONSTRAINTS:
1. Score categories: "totalScore", "logicScore", "communicationScore", "codeQualityScore".
2. If the user finished without completing or submitting code for any questions, all scores must strictly be 0.
3. Be highly objective and critical. If code submissions fail test cases or show structural flaws, penalize logic/quality scores.
4. If "totalScore" is less than 65, the feedback "verdict" MUST be "NO HIRE".

Return STRICT JSON ONLY, adhering to this structure:
{
  "totalScore": 80,
  "logicScore": 85,
  "communicationScore": 75,
  "codeQualityScore": 80,
  "overallFeedback": "Consolidated interview performance summary...",
  "strengths": ["list of overall strengths"],
  "weaknesses": ["list of overall weaknesses"],
  "verdict": "HIRE / NO HIRE / STRONG HIRE"
}
`;

  const response = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [
      { role: "system", content: "You are a technical hiring manager. Return ONLY JSON." },
      { role: "user", content: prompt }
    ]
  });

  return safeParseAIJSON(response.choices[0].message.content);
};

// -------- Generate Career Roadmap --------
exports.generateCareerRoadmap = async (goal, experience, timeline, userId) => {
  const prompt = `
You are an AI career coach for software developers.

User Goal:
${goal}
Experience Level:
${experience}
Timeline:
${timeline}

Generate a step-by-step roadmap including skills, projects, and DSA topics.
`;

  const response = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [
      { role: "system", content: "You are an AI career coach." },
      { role: "user", content: prompt }
    ]
  });

  const roadmap = response.choices[0].message.content;

  await aiLogRepository.createLog({
    userId,
    problemId: null,
    prompt,
    response: roadmap
  });

  return roadmap;
};

// -------- Evaluate Interview Code Against Dynamic Test Cases --------
exports.evaluateCodeAgainstTests = async (question, code, language) => {
  const prompt = `
    You are a technical interviewer and code testing validator.
    
    Given this interview question/problem details:
    ---
    ${question}
    ---

    Candidate's Solution Code (in ${language}):
    ---
    ${code}
    ---

    Analyze the candidate's solution code. You must generate 3 distinct test cases representing normal, edge case, and large or negative input scenarios.
    Evaluate the candidate's implementation against these test cases.
    
    Return ONLY a STRICT raw JSON response matching the following schema.
    Do not wrap it in markdown code blocks. Ensure there are no unescaped native newline characters in the string values (escape them as literal \\\\n).
    
    {
      "success": true, // true if all 3 test cases pass successfully, false otherwise
      "feedback": "A concise 1-2 sentence overall feedback summary explaining why tests passed or failed.",
      "testCases": [
        {
          "input": "Input parameters description",
          "expected": "Expected result description",
          "output": "Actual result output by candidate's logic, or description of syntax exception",
          "passed": true // true if matching, false otherwise
        },
        {
          "input": "Input parameters description",
          "expected": "Expected result description",
          "output": "Actual result output by candidate's logic, or description of syntax exception",
          "passed": true
        },
        {
          "input": "Input parameters description",
          "expected": "Expected result description",
          "output": "Actual result output by candidate's logic, or description of syntax exception",
          "passed": false
        }
      ]
    }
  `;

  const response = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [
      { role: "system", content: "You are a code assessment tool. Return ONLY strictly valid raw JSON. Always escape newlines inside JSON string values as \\\\n." },
      { role: "user", content: prompt }
    ]
  });

  const content = response.choices[0].message.content.trim();
  try {
    return safeParseAIJSON(content);
  } catch (error) {
    console.error("Failed to parse tested code LLM response:", content, error);
    // Fallback test case results
    return {
      success: false,
      feedback: "Code evaluation parsing encountered an AI compilation error. Please try running your tests again.",
      testCases: [
        { input: "Generics", expected: "Correct output", output: "Compiler parsing error", passed: false }
      ]
    };
  }
};

// -------- Generate Lazy Step Assets (Study Guide, Resources, Projects, Interview, Revision) via Groq --------
exports.generateLazyStepAssets = async (stepTitle, goal) => {
  const prompt = `
You are an expert technical interviewer and AI career coach.
Generate a comprehensive study guide, resource links, practice projects, prep interview questions, and revision checklist items for the milestone topic: "${stepTitle}".
The candidate's target career goal is: "${goal}".

You must return a STRICT raw JSON response ONLY. Do NOT wrap it in HTML tags, markdown code blocks, or conversational text.
Ensure there are no raw unescaped newlines inside the JSON string values (escape them as \\n).

JSON Schema matching:
{
  "study_guide_markdown": "Markdown string covering:\\n1. Overview\\n2. Learning Objectives\\n3. Advanced Core Concepts\\nEnsure the markdown output is clean, formatted, and complete.",
  "recommended_resources": [
    {
      "title": "Resource Title",
      "url": "https://example.com/url (real URL matching the resource if possible, or standard reference URL)",
      "source": "Official Documentation | GitHub | YouTube | Article | Book | Course",
      "reason": "Why this resource is recommended..."
    }
  ],
  "practice_projects": [
    {
      "title": "Authentication API or similar hands-on project",
      "description": "Short overview of the project.",
      "difficulty": "beginner | intermediate | advanced",
      "estimated_time": "Estimated completion time, e.g. 4 hours",
      "tasks": [
        {
          "title": "Task title (e.g. JWT)",
          "difficulty": "beginner | intermediate | advanced",
          "estimatedTime": "e.g. 30 mins"
        }
      ]
    }
  ],
  "interview_preps": [
    {
      "difficulty": "beginner | intermediate | advanced | follow_up",
      "question_text": "Detailed interview question text.",
      "expected_answer": "Expected approach, explanation, or code strategy details.",
      "tags": ["Tag1", "Tag2"],
      "estimated_duration": 15
    }
  ],
  "revision_checklist": [
    "Revision checklist item title (e.g. JWT cookies usage)"
  ]
}
`;

  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: "You are a professional technical mentor. Return ONLY raw strictly valid JSON matching the requested schema." },
        { role: "user", content: prompt }
      ]
    });

    const parsed = safeParseAIJSON(response.choices[0].message.content);

    // Validate structure arrays
    if (!parsed.recommended_resources || !Array.isArray(parsed.recommended_resources)) parsed.recommended_resources = [];
    if (!parsed.practice_projects || !Array.isArray(parsed.practice_projects)) parsed.practice_projects = [];
    if (!parsed.interview_preps || !Array.isArray(parsed.interview_preps)) parsed.interview_preps = [];
    if (!parsed.revision_checklist || !Array.isArray(parsed.revision_checklist)) parsed.revision_checklist = [];

    return parsed;
  } catch (error) {
    console.error("[Groq AI Error] Failed to generate lazy step assets:", error);
    // Provide a detailed fallback structure matching the schemas
    return {
      study_guide_markdown: `### Overview\nLearning plan for **${stepTitle}** to achieve goal: *${goal}*.\n\n### Learning Objectives\n- Understand core mechanisms and integration methods.\n- Practice implementation patterns.`,
      recommended_resources: [
        {
          title: "Official Documentation",
          url: "https://developer.mozilla.org",
          source: "Official Documentation",
          reason: "Essential reference materials covering core usage and patterns."
        },
        {
          title: "roadmap.sh Guides",
          url: "https://roadmap.sh",
          source: "Course",
          reason: "Step-by-step visuals showing developers learning paths."
        }
      ],
      practice_projects: [
        {
          title: "Hands-on Practice Sandbox",
          description: "Build a prototype showcasing core implementations.",
          difficulty: "intermediate",
          estimated_time: "4 hours",
          tasks: [
            { title: "Configure local boilerplate", difficulty: "beginner", estimatedTime: "30 mins" },
            { title: "Write core logic parameters", difficulty: "intermediate", estimatedTime: "90 mins" },
            { title: "Add verification testing suite", difficulty: "advanced", estimatedTime: "60 mins" }
          ]
        }
      ],
      interview_preps: [
        {
          difficulty: "intermediate",
          question_text: `What are the pros and cons of using ${stepTitle} in a modern web service?`,
          expected_answer: "Explain architecture constraints, scaling limits, caching strategies.",
          tags: ["Architecture", "System Design"],
          estimated_duration: 20
        }
      ],
      revision_checklist: [
        "Review core definition criteria",
        "Verify optimization edge bounds"
      ]
    };
  }
};