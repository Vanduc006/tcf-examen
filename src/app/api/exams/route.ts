import { listExams, createExamFromYoutube } from "@/lib/exams";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const exams = await listExams();
    return NextResponse.json(exams);
  } catch (error) {
    console.error("GET /api/exams:", error);
    return NextResponse.json(
      { error: "Failed to load exams. Check Supabase connection." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const youtubeUrl = body?.youtubeUrl?.trim();

    if (!youtubeUrl) {
      return NextResponse.json(
        { error: "YouTube URL is required" },
        { status: 400 },
      );
    }

    const exam = await createExamFromYoutube({
      youtubeUrl,
      title: body?.title?.trim(),
      provider: body?.provider,
    });

    return NextResponse.json(exam, { status: 201 });
  } catch (error) {
    console.error("POST /api/exams:", error);
    const message =
      error instanceof Error ? error.message : "Failed to create exam";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const maxDuration = 300;
