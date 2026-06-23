export function calculateATSScore(resumeText: string): number {
  if (!resumeText) return 0;

  let score = 50;

  const text = resumeText.toLowerCase();

  const keywords = [
    "experience",
    "skills",
    "education",
    "projects",
    "certification",
    "achievements",
    "work",
  ];

  keywords.forEach((word) => {
    if (text.includes(word)) {
      score += 6;
    }
  });

  if (resumeText.length > 1200) score += 10;
  if (resumeText.length < 300) score -= 10;

  return Math.max(0, Math.min(100, score));
}

// ✅ AI FEEDBACK ENGINE (NEW PART)
export function generateAIFeedback(resumeText: string, score: number): string[] {
  const feedback: string[] = [];
  const text = resumeText.toLowerCase();

  if (!text.includes("experience")) {
    feedback.push("Add a clear WORK EXPERIENCE section.");
  }

  if (!text.includes("skills")) {
    feedback.push("Include a SKILLS section with relevant tools.");
  }

  if (!text.includes("projects")) {
    feedback.push("Add PROJECTS to show practical experience.");
  }

  if (!text.includes("education")) {
    feedback.push("Include your EDUCATION details.");
  }

  if (!text.includes("achievements")) {
    feedback.push("Add ACHIEVEMENTS to improve ATS strength.");
  }

  if (score < 60) {
    feedback.push("Resume is weak for ATS systems — needs restructuring.");
  } else if (score >= 80) {
    feedback.push("Strong ATS-friendly resume with good structure.");
  } else {
    feedback.push("Good resume — but can be improved for better ATS ranking.");
  }

  return feedback;
}