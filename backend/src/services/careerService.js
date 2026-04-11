const pdf = require("pdf-parse");
const Groq = require("groq-sdk");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

/**
 * Extract text from local buffer
 */
exports.extractTextFromPdf = async (buffer) => {
  try {
    const data = await pdf(buffer);
    return data.text;
  } catch (error) {
    console.error("PDF Parsing Error:", error);
    throw new Error("Failed to parse PDF resume.");
  }
};

/**
 * Analyze resume text via AI
 */
exports.analyzeResumeText = async (resumeText) => {
  try {
    const prompt = `
      You are an expert technical recruiter and career coach.
      
      Analyze this resume text:
      ---
      ${resumeText}
      ---

      Return ONLY a STRICT JSON object:
      {
        "skills": ["List of core technical skills"],
        "experience": "Brief 1-sentence summary of experience level",
        "top_projects": ["2-3 project highlights"],
        "career_gaps": ["Potential technical gaps based on modern standards"]
      }
    `;

    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: "Return ONLY JSON." },
        { role: "user", content: prompt }
      ]
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error("Resume Analysis Error:", error);
    throw new Error("Failed to analyze resume text.");
  }
};

/**
 * Handle full PDF analysis
 */
exports.analyzeResume = async (buffer) => {
  const text = await exports.extractTextFromPdf(buffer);
  const analysis = await exports.analyzeResumeText(text);
  return { text, analysis };
};

/**
 * Generate a specialized roadmap using resume context
 */
exports.generatePersonalizedRoadmap = async (userId, profileData, resumeAnalysis) => {
  const prompt = `
    Create a personalized technical roadmap for a ${profileData.role} targeting ${profileData.target_domain}.
    
    Resume Context:
    - Skills: ${resumeAnalysis.skills.join(", ")}
    - Experience: ${resumeAnalysis.experience}
    - Identified Gaps: ${resumeAnalysis.career_gaps.join(", ")}

    User Onboarding Answers:
    ${JSON.stringify(profileData.answers)}

    Provide a step-by-step 3-month roadmap to bridge gaps and reach target role.
  `;

  const response = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [
      { role: "system", content: "You are a career mentor." },
      { role: "user", content: prompt }
    ]
  });

  return response.choices[0].message.content;
};
