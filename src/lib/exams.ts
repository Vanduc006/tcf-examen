import { getAdminClient } from "@/lib/db";
import { extractQuestionsFromVtt } from "@/lib/llm";
import { timestampToSeconds } from "@/lib/timestamp";
import type {
  CreateExamRequest,
  Exam,
  ExamDetail,
  ExtractedQuestion,
  Option,
  Question,
} from "@/lib/types";
import { buildVideoUrl, extractVideoId, fetchVideoTranscript } from "@/lib/youtube";

// ─── List exams ────────────────────────────────────────────────────────────────

export async function listExams(): Promise<Exam[]> {
  const { data, error } = await getAdminClient()
    .from("exams")
    .select("id, title, video_url, youtube_id, question_count, created_at")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as Exam[];
}

// ─── Get exam by ID ────────────────────────────────────────────────────────────

export async function getExamById(id: number): Promise<ExamDetail | null> {
  const { data: examData, error: examError } = await getAdminClient()
    .from("exams")
    .select("id, title, video_url, youtube_id, question_count, created_at")
    .eq("id", id)
    .single();

  if (examError || !examData) return null;

  const { data: questionData, error: questionError } = await getAdminClient()
    .from("questions")
    .select(`
      id, exam_id, part_number, question_number, question_text,
      transcript, image_url, note, timestamp_start, timestamp_seconds,
      options (id, question_id, choice_letter, choice_text, is_correct)
    `)
    .eq("exam_id", id)
    .order("question_number", { ascending: true });

  if (questionError) throw new Error(questionError.message);

  const questions: Question[] = (questionData ?? []).map((q: any) => ({
    ...q,
    options: (q.options ?? []).sort((a: Option, b: Option) =>
      a.choice_letter.localeCompare(b.choice_letter)
    ),
  }));

  return { ...examData, questions } as ExamDetail;
}

// ─── Delete exam ───────────────────────────────────────────────────────────────

export async function deleteExam(id: number): Promise<boolean> {
  const { error, count } = await getAdminClient()
    .from("exams")
    .delete({ count: "exact" })
    .eq("id", id);

  if (error) throw new Error(error.message);
  return (count ?? 0) > 0;
}

// ─── Insert question + options ─────────────────────────────────────────────────

async function insertQuestionWithOptions(
  examId: number,
  question: ExtractedQuestion
): Promise<void> {
  const timestampSeconds = timestampToSeconds(question.timestamp_start);

  const { data: qData, error: qError } = await getAdminClient()
    .from("questions")
    .insert({
      exam_id: examId,
      part_number: question.part_number,
      question_number: question.question_number,
      question_text: question.question_text ?? null,
      transcript: question.transcript ?? null,
      timestamp_start: question.timestamp_start,
      timestamp_seconds: timestampSeconds,
    })
    .select("id")
    .single();

  if (qError) throw new Error(qError.message);
  const questionId = qData.id;

  const opts = question.options.map((opt) => ({
    question_id: questionId,
    choice_letter: opt.choice_letter.toUpperCase(),
    choice_text: opt.choice_text,
    is_correct: opt.is_correct,
  }));

  const { error: optError } = await getAdminClient()
    .from("options")
    .insert(opts);

  if (optError) throw new Error(optError.message);
}

// ─── Create exam from YouTube ──────────────────────────────────────────────────

export async function createExamFromYoutube(
  input: CreateExamRequest
): Promise<ExamDetail> {
  const videoId = extractVideoId(input.youtubeUrl);
  const { vtt, title } = await fetchVideoTranscript(videoId);
  const questions = await extractQuestionsFromVtt(vtt, input.provider);

  const examTitle = input.title?.trim() || title;
  const videoUrl = buildVideoUrl(videoId);

  const { data: examData, error: examError } = await getAdminClient()
    .from("exams")
    .insert({
      title: examTitle,
      video_url: videoUrl,
      youtube_id: videoId,
      question_count: questions.length,
    })
    .select("id")
    .single();

  if (examError) throw new Error(examError.message);
  const examId = examData.id;

  for (const question of questions) {
    await insertQuestionWithOptions(examId, question);
  }

  const exam = await getExamById(examId);
  if (!exam) throw new Error("Failed to load created exam");
  return exam;
}

// ─── Update question ───────────────────────────────────────────────────────────

export async function updateQuestion(
  id: number,
  data: {
    image_url?: string;
    question_text?: string;
    transcript?: string;
    note?: string;
    options?: { id: number; choice_text: string; is_correct: boolean }[];
  }
): Promise<boolean> {
  const { error } = await getAdminClient()
    .from("questions")
    .update({
      image_url: data.image_url ?? null,
      question_text: data.question_text ?? null,
      transcript: data.transcript ?? null,
      note: data.note ?? null,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  if (data.options) {
    for (const opt of data.options) {
      const { error: optError } = await getAdminClient()
        .from("options")
        .update({ choice_text: opt.choice_text, is_correct: opt.is_correct })
        .eq("id", opt.id)
        .eq("question_id", id);

      if (optError) throw new Error(optError.message);
    }
  }

  return true;
}
