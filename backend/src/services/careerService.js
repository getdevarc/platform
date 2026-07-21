const { PDFParse } = require("pdf-parse");
const Groq = require("groq-sdk");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

/**
 * Extract text from local buffer
 */
exports.extractTextFromPdf = async (buffer) => {
  try {
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    return result.text;
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
 * Generate a personalized technical roadmap with summary, timeline, and steps
 */
exports.generatePersonalizedRoadmap = async (userId, profileData, resumeAnalysis) => {
  const skillsStr = resumeAnalysis && Array.isArray(resumeAnalysis.skills) ? resumeAnalysis.skills.join(", ") : "";
  const expStr = resumeAnalysis ? resumeAnalysis.experience || "" : "";
  const gapsStr = resumeAnalysis && Array.isArray(resumeAnalysis.career_gaps) ? resumeAnalysis.career_gaps.join(", ") : "";

  const prompt = `
    Create a personalized technical career roadmap summary, timeline, and high-level milestones list for a ${profileData.role} targeting ${profileData.target_domain}.
    
    Resume Context:
    - Skills: ${skillsStr}
    - Experience: ${expStr}
    - Identified Gaps: ${gapsStr}

    User Onboarding Answers:
    ${JSON.stringify(profileData.answers)}

    Provide a learning roadmap structure. You MUST return ONLY a valid STRICT JSON object:
    {
      "career_summary": "A 2-3 sentence personalized career transition or progress summary.",
      "estimated_timeline": "Overall timeline estimate (e.g., \\"3 months\\")",
      "steps": [
        {
          "title": "Title of Step 1",
          "description": "Short description of what to learn in Step 1",
          "type": "dsa | project | skill",
          "status": "IN_PROGRESS",
          "duration": 6
        },
        {
          "title": "Title of Step 2",
          "description": "Short description of what to learn in Step 2",
          "type": "dsa | project | skill",
          "status": "NOT_STARTED",
          "duration": 12
        },
        {
          "title": "Title of Step 3",
          "description": "Short description of what to learn in Step 3",
          "type": "dsa | project | skill",
          "status": "NOT_STARTED",
          "duration": 10
        }
      ]
    }

    Set the FIRST step status to "IN_PROGRESS" and all subsequent step statuses to "NOT_STARTED".
    Ensure "duration" is represented as an integer (estimated hours to study/master the step core elements).
    CRITICAL: Output ONLY valid raw JSON. No markdown wrappers. Escape all quotes.
  `;

  const response = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [
      { role: "system", content: "You must return a raw JSON object string matching the requested schema. Do not wrap in markdown code blocks." },
      { role: "user", content: prompt }
    ]
  });

  const responseText = response.choices[0].message.content.trim();
  try {
    return JSON.parse(responseText);
  } catch (e) {
    console.error("Failed to parse LLM roadmap JSON directly, attempting cleanup...");
    let cleanedText = responseText;
    try {
      const codeBlockMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/) || responseText.match(/```\s*([\s\S]*?)\s*```/);
      if (codeBlockMatch) {
        cleanedText = codeBlockMatch[1].trim();
      }
      return JSON.parse(cleanedText);
    } catch (innerErr) {
      console.error("Failed to parse extracted codeblock JSON:", innerErr);
    }
    // Deep escape raw control characters as a last resort
    try {
      const escapeNewlines = responseText.replace(/\n/g, "\\n");
      return JSON.parse(escapeNewlines);
    } catch (deepErr) {
      console.error("Deep cleanup parsing failed:", deepErr);
    }
    // Fallback schema
    return {
      career_summary: `Targeting transition to ${profileData.target_domain} as a ${profileData.role}`,
      estimated_timeline: "3 months",
      steps: [
        { title: `Transitioning to ${profileData.target_domain}`, description: "Initial learning modules.", type: "skill", status: "IN_PROGRESS", duration: 8 }
      ]
    };
  }
};
