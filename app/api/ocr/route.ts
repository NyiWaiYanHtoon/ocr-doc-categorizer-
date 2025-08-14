import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const ocrFormData = new FormData();
    ocrFormData.append("file", file);
    ocrFormData.append("apikey", process.env.OCRSPACE_API_KEY!); // server-side key
    ocrFormData.append("language", "eng");

    const ocrResponse = await fetch("https://api.ocr.space/parse/image", {
      method: "POST",
      body: ocrFormData,
    });

    const data = await ocrResponse.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error("OCR API error:", error);
    return NextResponse.json(
      { error: "Failed to process OCR" },
      { status: 500 }
    );
  }
}
