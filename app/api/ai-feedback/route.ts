import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { resumeText, score } = await req.json();

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

    return Response.json({
      feedback: response.choices[0].message.content,
    });
  } catch (error) {
    return Response.json(
      { feedback: "AI failed to respond." },
      { status: 500 }
    );
  }
}