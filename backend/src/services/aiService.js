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
    await eventService.logEvent(sessionId, "ai_review");
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
      content: "You are a Senior Software Engineer from a Top Tech Co conducting a coding interview. Be professional, slightly challenging, but encouraging. Focus on problem-solving, edge cases, and optimization." 
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
exports.generateFinalInterviewReport = async (transcript) => {
  const prompt = `
Analyze this coding interview transcript and provide a professional evaluation report.

Transcript:
${JSON.stringify(transcript)}

Return STRICT JSON:
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