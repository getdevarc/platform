const Groq = require("groq-sdk");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

exports.generateHint = async (problem, userCode) => {

  const prompt = `
You are an expert DSA mentor.

Problem:
${problem.description}

User Code:
${userCode}

Give a helpful hint to guide the user toward solving the problem.

Rules:
- Do NOT reveal the full solution
- Suggest a direction or pattern
- Keep hint concise
`;

  const response = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [
      {
        role: "system",
        content: "You are a helpful coding mentor."
      },
      {
        role: "user",
        content: prompt
      }
    ]
  });

  return response.choices[0].message.content;
};