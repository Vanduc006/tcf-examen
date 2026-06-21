import { extractOptionsFromText, extractOptionsFromImage } from "@/lib/ai";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { text, image_url } = await request.json();

    if (image_url && !text) {
      // Nếu có image_url, fetch và xử lý multimodal
      const res = await fetch(image_url);
      const blob = await res.blob();
      const buffer = Buffer.from(await blob.arrayBuffer());
      const base64 = buffer.toString("base64");
      const options = await extractOptionsFromImage(base64);
      return NextResponse.json({ options });
    }

    if (text) {
      const options = await extractOptionsFromText(text);
      return NextResponse.json({ options });
    }

    return NextResponse.json({ error: "Missing text or image_url" }, { status: 400 });
  } catch (error) {
    console.error("AI Process Options error:", error);
    return NextResponse.json({ error: "Failed to process options" }, { status: 500 });
  }
}
