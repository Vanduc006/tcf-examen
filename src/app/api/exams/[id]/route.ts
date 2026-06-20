import { deleteExam, getExamById } from "@/lib/exams";
import { NextResponse } from "next/server";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const examId = Number(id);
    if (Number.isNaN(examId)) {
      return NextResponse.json({ error: "Invalid exam id" }, { status: 400 });
    }

    const exam = await getExamById(examId);
    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    return NextResponse.json(exam);
  } catch (error) {
    console.error("GET /api/exams/[id]:", error);
    return NextResponse.json(
      { error: "Failed to load exam" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const examId = Number(id);
    if (Number.isNaN(examId)) {
      return NextResponse.json({ error: "Invalid exam id" }, { status: 400 });
    }

    const deleted = await deleteExam(examId);
    if (!deleted) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/exams/[id]:", error);
    return NextResponse.json(
      { error: "Failed to delete exam" },
      { status: 500 },
    );
  }
}
