export interface Exam {
  id: number;
  title: string;
  video_url: string;
  youtube_id: string;
  question_count: number;
  created_at: string;
}

export interface Option {
  id: number;
  question_id: number;
  choice_letter: string;
  choice_text: string;
  is_correct: boolean;
}

export interface Question {
  id: number;
  exam_id: number;
  part_number: number;
  question_number: number;
  question_text: string | null;
  transcript?: string | null;
  image_url?: string | null;
  note?: string | null;
  timestamp_start: string;
  timestamp_seconds: number;
  options: Option[];
}

export interface ExamDetail extends Exam {
  questions: Question[];
}

export interface ExtractedOption {
  choice_letter: string;
  choice_text: string;
  is_correct: boolean;
}

export interface ExtractedQuestion {
  question_number: number;
  timestamp_start: string;
  question_text: string;
  transcript?: string;
  part_number: number;
  options: ExtractedOption[];
}

export interface CreateExamRequest {
  youtubeUrl: string;
  title?: string;
  provider?: "openai" | "gemini" | "claude";
}
