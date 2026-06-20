import ExamList from "@/components/ExamList";
import { listExams } from "@/lib/exams";
import type { Exam } from "@/lib/types";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let exams: Exam[] = [];
  let dbError = false;

  try {
    exams = await listExams();
  } catch {
    dbError = true;
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-purple-50/80 to-gray-50">
      <header className="border-b border-[#6b2d82]/20 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#6b2d82]">
              TCF Practice
            </p>
            <h1 className="text-2xl font-bold text-gray-900">
              Compréhension Orale
            </h1>
          </div>
          <Link
            href="/create"
            className="rounded-lg bg-[#6b2d82] px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-[#5a256d]"
          >
            + Nouveau test
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-10">
        {dbError && (
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Impossible de se connecter à MySQL. Vérifiez votre fichier{" "}
            <code className="rounded bg-amber-100 px-1">.env.local</code> et
            exécutez{" "}
            <code className="rounded bg-amber-100 px-1">
              mysql &lt; database/schema.sql
            </code>
            .
          </div>
        )}

        <h2 className="mb-6 text-lg font-semibold text-gray-800">
          Mes tests ({exams.length})
        </h2>

        <ExamList exams={exams} />
      </div>
    </main>
  );
}
