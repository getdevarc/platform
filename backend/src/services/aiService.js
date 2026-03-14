const Groq = require("groq-sdk");
const aiLogRepository = require("../repositories/aiLogRepository");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

exports.generateHint = async (problem, userCode, userId) => {

  const prompt = `
You are an expert DSA mentor.

Problem:
${problem.description}

User Code:
${userCode}

Give a helpful hint that guides the user toward solving the problem.
`;

  const response = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [
      { role: "system", content: "You are a coding mentor." },
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

  return hint;
};


// -------- Generate Explanation --------
exports.generateExplanation = async (problem, userCode, userId) => {

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

  return explanation;
};

// -------- Generate Code Review --------
exports.generateCodeReview = async (problem, userCode, userId) => {

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

  return review;
};

// -------- Generate Interview Question --------
exports.generateInterviewQuestion = async () => {

  const prompt = `
You are a senior software engineer conducting a coding interview.

Generate one DSA interview question.

Include:
- Problem title
- Description
- Example
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

// -------- Evaluate Interview Answer --------
exports.evaluateInterviewAnswer = async (question, userCode) => {

  const prompt = `
You are a coding interviewer.

Question:
${question}

Candidate Code:
${userCode}

Evaluate the answer.

Return:

Correctness:
Time Complexity:
Code Quality:
Suggestions:
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