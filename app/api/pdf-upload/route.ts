import { NextResponse } from "next/server";
import PDFParser from "pdf2json";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const text = await new Promise<string>((resolve, reject) => {
      const pdfParser = new (PDFParser as any)(null, 1);

      pdfParser.on("pdfParser_dataError", (err: any) => {
        reject(err.parserError);
      });

      pdfParser.on("pdfParser_dataReady", (pdfData: any) => {
        const rawText = (pdfData.Pages || [])
          .map((page: any) =>
            (page.Texts || [])
              .map((t: any) => t.R?.[0]?.T || "")
              .join(" ")
          )
          .join("\n");

        resolve(rawText);
      });

      pdfParser.parseBuffer(buffer);
    });

    return NextResponse.json({
      text: text || "",
    });
  } catch (error: any) {
    console.error("PDF ERROR:", error);

    return NextResponse.json(
      {
        error: "PDF parsing failed",
        details: error?.message,
      },
      { status: 500 }
    );
  }
}