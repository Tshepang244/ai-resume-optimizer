import OpenAI from "openai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const resumeText = body?.resumeText;

    if (!resumeText) {
      return NextResponse.json(
        { error: "Resume text is required" },
        { status: 400 }
      );
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a professional ATS resume writer. Rewrite CVs to be clear, structured, keyword-rich, and optimized for Applicant Tracking Systems.",
        },
        {
          role: "user",
          content: `
Rewrite this CV into a professional ATS-optimized version.

Rules:
- Use strong action verbs
- Improve clarity and structure
- Add measurable achievements where possible
- Keep sections: Summary, Skills, Experience, Education
- Do NOT add fake information

CV:
${resumeText}
          `,
        },
      ],
    });

    const rewritten = completion.choices?.[0]?.message?.content;

    return NextResponse.json({
      rewritten,
    });
  } catch (error: any) {
    console.error("AI REWRITE ERROR:", error);

    return NextResponse.json(
      {
        error: "AI rewrite failed",
        details: error?.message,
      },
      { status: 500 }
    );
  }
}