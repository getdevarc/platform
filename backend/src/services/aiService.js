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

Rules:
- Do NOT reveal the full solution
- Suggest direction or pattern
- Keep hint concise
`;

  const response = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [
      { role: "system", content: "You are a coding mentor." },
      { role: "user", content: prompt }
    ]
  });

  const hint = response.choices[0].message.content;

  // store log
  await aiLogRepository.createLog({
    userId,
    problemId: problem.id,
    prompt,
    response: hint
  });

  return hint;
};