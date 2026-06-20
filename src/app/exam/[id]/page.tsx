import ExamPlayer from "@/components/ExamPlayer";
import { getExamById } from "@/lib/exams";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export default async function ExamPage({ params }: PageProps) {
  const { id } = await params;
  const examId = Number(id);

  if (Number.isNaN(examId)) notFound();

  let exam = null;
  try {
    exam = await getExamById(examId);
  } catch {
    return (
      <main className="mx-auto max-w-4xl px-6 py-16 text-center">
        <p className="text-gray-600">Erreur de connexion à la base de données.</p>
        <Link href="/" className="mt-4 inline-block text-[#6b2d82] underline">
          Retour
        </Link>
      </main>
    );
  }

  if (!exam) notFound();

  return (
    <main className="min-h-screen bg-gradient-to-b from-purple-50/80 to-gray-50 px-4 py-8 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <ExamPlayer exam={exam} />
      </div>
    </main>
  );
}
