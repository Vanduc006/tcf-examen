"use client";

import type { ExamDetail } from "@/lib/types";
import Link from "next/link";
import { useMemo, useState } from "react";
import QuestionView from "./QuestionView";

interface ExamPlayerProps {
  exam: ExamDetail;
}

export default function ExamPlayer({ exam }: ExamPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showAnswer, setShowAnswer] = useState(false);

  const question = exam.questions[currentIndex];
  const selectedLetter = answers[question?.question_number] ?? null;

  const answeredCount = useMemo(
    () => Object.keys(answers).length,
    [answers],
  );

  if (!question) {
    return (
      <p className="text-center text-gray-600">Aucune question dans ce test.</p>
    );
  }

  const goTo = (index: number) => {
    setShowAnswer(false);
    setCurrentIndex(index);
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href="/"
            className="text-sm text-[#6b2d82] hover:underline"
          >
            ← Retour à l&apos;accueil
          </Link>
          <h1 className="mt-1 text-xl font-bold text-gray-900">{exam.title}</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">
            {answeredCount}/{exam.questions.length} répondues
          </span>
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={showAnswer}
              onChange={(e) => setShowAnswer(e.target.checked)}
              className="rounded border-gray-300 text-[#6b2d82] focus:ring-[#6b2d82]"
            />
            Afficher les réponses
          </label>
        </div>
      </div>

      <QuestionView
        question={question}
        endTimestampSeconds={exam.questions[currentIndex + 1]?.timestamp_seconds}
        youtubeId={exam.youtube_id}
        totalQuestions={exam.questions.length}
        selectedLetter={selectedLetter}
        showAnswer={showAnswer}
        onSelect={(letter) =>
          setAnswers((prev) => ({
            ...prev,
            [question.question_number]: letter,
          }))
        }
      />

      <div className="mt-6 flex items-center justify-between">
        <button
          type="button"
          onClick={() => goTo(Math.max(0, currentIndex - 1))}
          disabled={currentIndex === 0}
          className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
        >
          ← Précédent
        </button>

        <div className="flex flex-wrap justify-center gap-1">
          {exam.questions.map((q, i) => (
            <button
              key={q.id}
              type="button"
              onClick={() => goTo(i)}
              className={`h-8 w-8 rounded text-xs font-medium ${
                i === currentIndex
                  ? "bg-[#6b2d82] text-white"
                  : answers[q.question_number]
                    ? "bg-purple-100 text-[#6b2d82]"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {q.question_number}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() =>
            goTo(Math.min(exam.questions.length - 1, currentIndex + 1))
          }
          disabled={currentIndex === exam.questions.length - 1}
          className="rounded-lg bg-[#6b2d82] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#5a256d] disabled:opacity-40"
        >
          Suivant →
        </button>
      </div>
    </div>
  );
}
