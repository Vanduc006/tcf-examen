-- ============================================================
-- TCF Practice DB — Supabase / PostgreSQL Schema
-- Chạy toàn bộ file này trong Supabase SQL Editor
-- ============================================================

-- ─── 1. TẠO BẢNG ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS exams (
  id             SERIAL PRIMARY KEY,
  title          TEXT NOT NULL,
  video_url      TEXT NOT NULL,
  youtube_id     VARCHAR(30) NOT NULL,
  question_count INT DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS questions (
  id               SERIAL PRIMARY KEY,
  exam_id          INT NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  part_number      INT CHECK (part_number BETWEEN 1 AND 4),
  question_number  INT NOT NULL,
  question_text    TEXT,
  transcript       TEXT,
  image_url        TEXT,
  note             TEXT,
  timestamp_start  VARCHAR(12) NOT NULL,
  timestamp_seconds INT NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_exam_question UNIQUE (exam_id, question_number)
);

CREATE TABLE IF NOT EXISTS options (
  id             SERIAL PRIMARY KEY,
  question_id    INT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  choice_letter  CHAR(1) NOT NULL,
  choice_text    TEXT NOT NULL,
  is_correct     BOOLEAN DEFAULT FALSE
);

-- ─── 2. BẬT ROW LEVEL SECURITY (RLS) ────────────────────────

ALTER TABLE exams     ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE options   ENABLE ROW LEVEL SECURITY;

-- ─── 3. RLS POLICIES ─────────────────────────────────────────
-- Chiến lược:
--   • anon (frontend không đăng nhập) → chỉ được SELECT
--   • service_role (server-side API)  → bypass RLS hoàn toàn (mặc định của Supabase)
--   Không có user nào có thể INSERT/UPDATE/DELETE từ client trực tiếp.

-- >> EXAMS
CREATE POLICY "Public can read exams"
  ON exams FOR SELECT
  TO anon
  USING (true);

-- >> QUESTIONS
CREATE POLICY "Public can read questions"
  ON questions FOR SELECT
  TO anon
  USING (true);

-- >> OPTIONS
CREATE POLICY "Public can read options"
  ON options FOR SELECT
  TO anon
  USING (true);

-- ─── 4. INDEXES ──────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_questions_exam_id ON questions(exam_id);
CREATE INDEX IF NOT EXISTS idx_options_question_id ON options(question_id);
