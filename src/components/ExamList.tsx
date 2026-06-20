"use client";

import type { Exam } from "@/lib/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface ExamListProps {
  exams: Exam[];
}

export default function ExamList({ exams }: ExamListProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDelete = async (id: number, title: string) => {
    const key = localStorage.getItem("adminKey");
    if (key !== "1000") {
      const input = window.prompt("Veuillez saisir la clé administrateur pour supprimer un test :");
      if (input === "1000") {
        localStorage.setItem("adminKey", input);
      } else {
        if (input !== null) {
          alert("Clé incorrecte.");
        }
        return;
      }
    }

    if (!confirm(`Supprimer le test « ${title} » ?`)) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/exams/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      router.refresh();
    } catch {
      alert("Impossible de supprimer le test.");
    } finally {
      setDeletingId(null);
    }
  };

  if (exams.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-12 text-center">
        <p className="text-gray-600">Aucun test pour le moment.</p>
        <Link
          href="/create"
          className="mt-4 inline-block text-[#6b2d82] underline hover:no-underline"
        >
          Créer votre premier test
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {exams.map((exam) => (
        <article
          key={exam.id}
          className="flex flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md"
        >
          <h3 className="line-clamp-2 text-base font-semibold text-gray-900">
            {exam.title}
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            {exam.question_count} questions
          </p>
          <p className="mt-1 text-xs text-gray-400">
            {new Date(exam.created_at).toLocaleDateString("fr-FR")}
          </p>

          <div className="mt-4 flex gap-2">
            <Link
              href={`/exam/${exam.id}`}
              className="flex-1 rounded-lg bg-[#6b2d82] px-4 py-2 text-center text-sm font-medium text-white hover:bg-[#5a256d]"
            >
              Commencer
            </Link>
            <button
              type="button"
              onClick={() => handleDelete(exam.id, exam.title)}
              disabled={deletingId === exam.id}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              title="Supprimer"
            >
              {deletingId === exam.id ? "..." : "✕"}
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
