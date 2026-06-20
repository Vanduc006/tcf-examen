import { updateQuestion } from "@/lib/exams";
import { NextResponse } from "next/server";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    const { image_url, question_text, transcript, note, options } = body;
    const success = await updateQuestion(Number(id), { image_url, question_text, transcript, note, options });
    
    if (!success) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PUT /api/questions/[id]:", error);
    return NextResponse.json({ error: "Failed to update question" }, { status: 500 });
  }
}
