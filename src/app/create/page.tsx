import CreateExamForm from "@/components/CreateExamForm";
import Link from "next/link";

export default function CreatePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-purple-50/80 to-gray-50 px-6 py-10">
      <div className="mb-8">
        <Link
          href="/"
          className="text-sm text-[#6b2d82] hover:underline"
        >
          ← Retour à l&apos;accueil
        </Link>
      </div>
      <CreateExamForm />
    </main>
  );
}
