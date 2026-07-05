import OpenAI from "openai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY is missing in this environment");
      return NextResponse.json(
        {
          rewritten: null,
          error: "Missing OPENAI_API_KEY",
          details:
            "The server has no OPENAI_API_KEY set. Add it in Vercel → Settings → Environment Variables for the Production environment, then redeploy.",
        },
        { status: 500 }
      );
    }

    const body = await req.json();
    const resumeText = body?.resumeText;

    if (!resumeText || !resumeText.trim()) {
      return NextResponse.json(
        { rewritten: null, error: "Resume text is required" },
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

    if (!rewritten) {
      console.error("AI REWRITE: empty response", completion);
      return NextResponse.json(
        {
          rewritten: null,
          error: "AI returned an empty response",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({ rewritten });
  } catch (error: any) {
    console.error("AI REWRITE ERROR:", error);

    const status = error?.status || 500;
    const details =
      error?.error?.message || error?.message || "Unknown error";

    return NextResponse.json(
      {
        rewritten: null,
        error: "AI rewrite failed",
        details,
      },
      { status }
    );
  }
}
