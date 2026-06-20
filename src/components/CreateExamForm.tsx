"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CreateExamForm() {
  const router = useRouter();
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [title, setTitle] = useState("");
  const [provider, setProvider] = useState<"openai" | "gemini" | "claude">("openai");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const key = localStorage.getItem("adminKey");
    if (key !== "1000") {
      const input = window.prompt("Veuillez saisir la clé administrateur pour créer un test :");
      if (input === "1000") {
        localStorage.setItem("adminKey", input);
      } else {
        if (input !== null) {
          alert("Clé incorrecte.");
        }
        return;
      }
    }

    setError("");
    setLoading(true);
    setStatus("Récupération des sous-titres YouTube...");

    let statusTimer: ReturnType<typeof setTimeout> | undefined;

    try {
      statusTimer = setTimeout(() => {
        setStatus("Analyse des sous-titres avec l'IA (peut prendre 1-3 min)...");
      }, 4000);

      const res = await fetch("/api/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          youtubeUrl,
          title: title || undefined,
          provider,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Échec de la création");
      }

      clearTimeout(statusTimer);
      setStatus("Test créé avec succès !");
      router.push(`/exam/${data.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
      setStatus("");
    } finally {
      if (statusTimer) clearTimeout(statusTimer);
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto max-w-xl rounded-2xl border border-gray-200 bg-white p-8 shadow-lg"
    >
      <h2 className="text-xl font-bold text-gray-900">Nouveau test TCF Orale</h2>
      <p className="mt-2 text-sm text-gray-600">
        Collez un lien YouTube d&apos;une série TCF Compréhension Orale. Les
        sous-titres seront extraits et transformés en questions automatiquement.
      </p>

      <div className="mt-6 space-y-4">
        <div>
          <label
            htmlFor="youtubeUrl"
            className="block text-sm font-medium text-gray-700"
          >
            Lien YouTube *
          </label>
          <input
            id="youtubeUrl"
            type="url"
            required
            placeholder="https://www.youtube.com/watch?v=..."
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-[#6b2d82] focus:outline-none focus:ring-1 focus:ring-[#6b2d82]"
          />
        </div>

        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700"
          >
            Titre (optionnel)
          </label>
          <input
            id="title"
            type="text"
            placeholder="Titre personnalisé — sinon titre YouTube"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-[#6b2d82] focus:outline-none focus:ring-1 focus:ring-[#6b2d82]"
          />
        </div>

        <div>
          <label
            htmlFor="provider"
            className="block text-sm font-medium text-gray-700"
          >
            Modèle IA
          </label>
          <select
            id="provider"
            value={provider}
            onChange={(e) => setProvider(e.target.value as "openai" | "gemini" | "claude")}
            className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm bg-white focus:border-[#6b2d82] focus:outline-none focus:ring-1 focus:ring-[#6b2d82]"
          >
            <option value="openai">OpenAI (GPT-4o-mini)</option>
            <option value="gemini">Google Gemini</option>
            <option value="claude">Anthropic Claude</option>
          </select>
        </div>
      </div>

      {status && (
        <div className="mt-4 rounded-lg bg-purple-50 px-4 py-3 text-sm text-[#6b2d82]">
          {loading && (
            <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-[#6b2d82] border-t-transparent" />
          )}
          {status}
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !youtubeUrl.trim()}
        className="mt-6 w-full rounded-lg bg-[#6b2d82] px-4 py-3 text-sm font-semibold text-white hover:bg-[#5a256d] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Création en cours..." : "Créer le test"}
      </button>
    </form>
  );
}
