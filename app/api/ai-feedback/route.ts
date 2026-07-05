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
          feedback: null,
          error: "Missing OPENAI_API_KEY",
          details:
            "The server has no OPENAI_API_KEY set. Add it in Vercel → Settings → Environment Variables for the Production environment, then redeploy.",
        },
        { status: 500 }
      );
    }

    const body = await req.json();
    const resumeText = body?.resumeText;
    const score = body?.score;

    if (!resumeText || !resumeText.trim()) {
      return NextResponse.json(
        { feedback: null, error: "Resume text is required" },
        { status: 400 }
      );
    }

    const prompt = `
You are an expert ATS resume reviewer.

Give clear, professional feedback on this resume.

Rules:
- 3 to 6 bullet points only
- Focus on ATS optimization
- Be direct and helpful

Score: ${score}/100

Resume:
${resumeText}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a professional CV reviewer and ATS expert.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const feedback = response.choices?.[0]?.message?.content;

    if (!feedback) {
      console.error("AI FEEDBACK: empty response", response);
      return NextResponse.json(
        {
          feedback: null,
          error: "AI returned an empty response",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({ feedback });
  } catch (error: any) {
    console.error("AI FEEDBACK ERROR:", error);

    // OpenAI SDK errors often carry a status + code that pin down the cause
    const status = error?.status || 500;
    const details =
      error?.error?.message || error?.message || "Unknown error";

    return NextResponse.json(
      {
        feedback: null,
        error: "AI feedback failed",
        details,
      },
      { status }
    );
  }
}
