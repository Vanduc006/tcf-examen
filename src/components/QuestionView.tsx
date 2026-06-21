"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Question } from "@/lib/types";
import HeadphonesVisualizer from "./HeadphonesVisualizer";
import YouTubeAudioPlayer from "./YouTubeAudioPlayer";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { supabase } from "@/lib/supabaseClient";



interface QuestionViewProps {
  question: Question;
  youtubeId: string;
  totalQuestions: number;
  endTimestampSeconds?: number;
  selectedLetter: string | null;
  showAnswer: boolean;
  onSelect: (letter: string) => void;
}

export default function QuestionView({
  question,
  youtubeId,
  totalQuestions,
  endTimestampSeconds,
  selectedLetter,
  showAnswer,
  onSelect,
}: QuestionViewProps) {
  const router = useRouter();
  const [isPlaying, setIsPlaying] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    image_url: question.image_url || "",
    question_text: question.question_text || "",
    transcript: question.transcript || "",
    note: question.note || "",
    options: question.options.map((o) => ({ ...o })),
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setShowHint(false);
    setIsEditing(false);
  }, [question.id]);

  const handleEditClick = () => {
    const key = localStorage.getItem("adminKey");
    if (key === "1000") {
      setEditForm({
        image_url: question.image_url || "",
        question_text: question.question_text || "",
        transcript: question.transcript || "",
        note: question.note || "",
        options: question.options.map((o) => ({ ...o })),
      });
      setIsEditing(true);
    } else {
      const input = window.prompt("Veuillez saisir la clé administrateur :");
      if (input === "1000") {
        localStorage.setItem("adminKey", input);
        setEditForm({
          image_url: question.image_url || "",
          question_text: question.question_text || "",
          transcript: question.transcript || "",
          note: question.note || "",
          options: question.options.map((o) => ({ ...o })),
        });
        setIsEditing(true);
      } else if (input) {
        alert("Clé incorrecte.");
      }
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/questions/${question.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        setIsEditing(false);
        router.refresh(); // Refresh data to show updates
      } else {
        alert("Erreur lors de la sauvegarde.");
      }
    } catch (e) {
      alert("Erreur réseau.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveImmediate = async (formData: typeof editForm) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/questions/${question.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        router.refresh();
      } else {
        console.error("Save immediate failed");
      }
    } catch (e) {
      console.error("Network error on save immediate", e);
    } finally {
      setSaving(false);
    }
  };


  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile();
        if (!file) continue;

        setSaving(true);
        try {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("bucket", "orale");

          const res = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });

          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || "Upload failed");
          }

          const { url } = await res.json();

          const updatedForm = { ...editForm, image_url: url };
          setEditForm(updatedForm);
          
          // Sau khi lấy được link, tự động save vào database luôn như yêu cầu
          await handleSaveImmediate(updatedForm);

          
        } catch (err) {

          console.error("Paste error:", err);
          alert("Une erreur est survenue lors du traitement de l'image.");
        } finally {
          setSaving(false);
        }
      }
    }
  };

  const handleDeleteImage = async () => {
    if (!editForm.image_url) return;
    
    if (!confirm("Voulez-vous vraiment supprimer cette image ?")) return;

    setSaving(true);
    try {
      // 1. Xóa file khỏi storage (qua API)
      await fetch("/api/upload", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: editForm.image_url, bucket: "orale" }),
      });

      // 2. Cập nhật state
      const updatedForm = { ...editForm, image_url: "" };
      setEditForm(updatedForm);

      // 3. Cập nhật database luôn (để đồng bộ với upload)
      await handleSaveImmediate(updatedForm);
    } catch (err) {
      console.error("Delete image error:", err);
      alert("Erreur lors de la suppression de l'image.");
    } finally {
      setSaving(false);
    }
  };


  return (
    <div className="grid min-h-[520px] grid-cols-1 gap-0 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg lg:grid-cols-2">
      <div className="flex flex-col items-center justify-center border-b border-gray-100 bg-gradient-to-b from-gray-50 to-white lg:border-b-0 lg:border-r">
        <HeadphonesVisualizer isPlaying={isPlaying} />
        <YouTubeAudioPlayer
          key={`${question.id}-${question.timestamp_seconds}`}
          videoId={youtubeId}
          timestampSeconds={question.timestamp_seconds}
          endTimestampSeconds={endTimestampSeconds}
          onPlayingChange={setIsPlaying}
        />
      </div>

      <div className="flex flex-col p-6 lg:p-8">
        <div className="mb-6 flex flex-wrap items-stretch gap-0">
          <div className="flex items-center rounded-l-lg border border-[#6b2d82] bg-white px-4 py-2">
            <span className="text-sm font-semibold text-gray-700">
              Question {question.question_number}
            </span>
          </div>
          <div className="flex flex-1 items-center rounded-r-lg bg-[#6b2d82] px-4 py-2">
            <p className="text-sm font-medium text-white">
              Écoutez le document sonore et la question. Notez la bonne réponse
            </p>
          </div>
        </div>

        <div className="mb-4">
          {isEditing ? (
            <div className="flex flex-col gap-2 rounded bg-gray-50 p-3 text-sm">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="URL de l'image (optionnel)"
                  value={editForm.image_url}
                  onChange={(e) => setEditForm(prev => ({ ...prev, image_url: e.target.value }))}
                  onPaste={handlePaste}
                  className="flex-1 rounded border border-gray-300 px-3 py-1.5 focus:border-[#6b2d82] focus:outline-none"
                />
                {editForm.image_url && (
                  <button
                    type="button"
                    onClick={handleDeleteImage}
                    title="Supprimer l'image"
                    className="flex items-center justify-center rounded border border-red-200 bg-red-50 px-3 text-red-600 hover:bg-red-100"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                  </button>
                )}
              </div>

              <textarea
                placeholder="Texte de la question"
                value={editForm.question_text}
                onChange={(e) => setEditForm(prev => ({ ...prev, question_text: e.target.value }))}
                onPaste={handlePaste}
                className="rounded border border-gray-300 px-3 py-1.5 focus:border-[#6b2d82] focus:outline-none min-h-[60px]"
              />

              <textarea
                placeholder="Transcript Audio (Hint)"
                value={editForm.transcript}
                onChange={(e) => setEditForm(prev => ({ ...prev, transcript: e.target.value }))}
                onPaste={handlePaste}
                className="rounded border border-gray-300 px-3 py-1.5 focus:border-[#6b2d82] focus:outline-none min-h-[60px]"
              />
              <textarea
                placeholder="Note (optionnel - Markdown supporté)"
                value={editForm.note}
                onChange={(e) => setEditForm(prev => ({ ...prev, note: e.target.value }))}
                onPaste={handlePaste}
                className="rounded border border-gray-300 px-3 py-1.5 focus:border-[#6b2d82] focus:outline-none min-h-[60px]"
              />

              <div className="mt-2 flex flex-col gap-2">
                <span className="font-semibold text-gray-700">Options :</span>
                {editForm.options.map((opt, i) => (
                  <div key={opt.id} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`correct-${question.id}`}
                      checked={opt.is_correct}
                      onChange={() => {
                        const newOptions = editForm.options.map((o, j) => ({
                          ...o,
                          is_correct: i === j,
                        }));
                        setEditForm((prev) => ({ ...prev, options: newOptions }));
                      }}
                      className="h-4 w-4 text-[#6b2d82]"
                    />
                    <span className="w-6 text-center font-bold">{opt.choice_letter}</span>
                    <input
                      type="text"
                      value={opt.choice_text}
                      onChange={(e) => {
                        const newOptions = [...editForm.options];
                        newOptions[i].choice_text = e.target.value;
                        setEditForm((prev) => ({ ...prev, options: newOptions }));
                      }}
                      className="flex-1 rounded border border-gray-300 px-2 py-1 focus:border-[#6b2d82] focus:outline-none"
                    />
                  </div>
                ))}
              </div>
              <div className="mt-1 flex justify-end gap-2 text-sm font-medium">
                <button type="button" onClick={() => setIsEditing(false)} className="px-3 py-1.5 text-gray-500 hover:text-gray-700">Annuler</button>
                <button type="button" onClick={handleSave} disabled={saving} className="rounded bg-[#6b2d82] px-4 py-1.5 text-white hover:bg-[#5a256d] disabled:opacity-50">
                  {saving ? "Sauvegarde..." : "Enregistrer"}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  {question.question_text ? (
                    <p className="text-sm italic text-gray-600">{question.question_text}</p>
                  ) : (
                    <p className="text-sm italic text-gray-400">Aucun texte</p>
                  )}
                </div>
                <button type="button" onClick={handleEditClick} className="shrink-0 text-xs text-[#6b2d82] hover:underline">
                  Modifier
                </button>
              </div>
              {question.image_url && (
                <div className="relative h-40 w-full overflow-hidden rounded bg-gray-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={question.image_url} alt="Illustration de la question" className="h-full w-full object-contain" />
                </div>
              )}
              {question.note && (
                <div className="rounded border border-yellow-200 bg-yellow-50 px-3 py-2 text-xs text-yellow-800">
                  <span className="font-semibold">Note:</span>
                  <div className="mt-1 prose-tight">
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      components={{
                        p: ({node, ...props}) => <p className="mb-1 last:mb-0" {...props} />,
                        ul: ({node, ...props}) => <ul className="list-disc ml-4 mb-1" {...props} />,
                        ol: ({node, ...props}) => <ol className="list-decimal ml-4 mb-1" {...props} />,
                        li: ({node, ...props}) => <li className="mb-0" {...props} />,
                        a: ({node, ...props}) => <a className="text-blue-600 underline" target="_blank" rel="noopener noreferrer" {...props} />,
                        code: ({node, ...props}) => <code className="bg-yellow-200/50 px-1 rounded" {...props} />,
                      }}
                    >
                      {question.note}
                    </ReactMarkdown>
                  </div>
                </div>

              )}

            </div>
          )}
        </div>

        {question.transcript && !isEditing && (
          <div className="mb-4 text-sm mt-3 border-t border-gray-100 pt-3">
            <button
              type="button"
              onClick={() => setShowHint(!showHint)}
              className="text-[#6b2d82] hover:underline font-medium"
            >
              {showHint ? "Cacher le Hint (Transcript)" : "Afficher le Hint (Transcript)"}
            </button>
            {showHint && (
              <div className="mt-2 text-gray-700 whitespace-pre-line rounded-lg bg-gray-50 border border-gray-200 p-3 italic">
                {question.transcript}
              </div>
            )}
          </div>
        )}

        <div className="flex flex-1 flex-col gap-3">
          {question.options.map((option) => {
            const letter = option.choice_letter.toLowerCase();
            const isSelected = selectedLetter === option.choice_letter;
            const isRevealed = showAnswer || !!selectedLetter;
            const isCorrect = isRevealed && option.is_correct;
            const isWrong = isRevealed && isSelected && !option.is_correct;

            let borderClass = "border-gray-200 hover:border-[#6b2d82]/40";
            if (isSelected && !isRevealed) {
              borderClass = "border-[#6b2d82] bg-purple-50/50";
            }
            if (isCorrect) {
              borderClass = "border-green-500 bg-green-50";
            }
            if (isWrong) {
              borderClass = "border-red-400 bg-red-50";
            }

            let letterBgClass = "bg-[#6b2d82]";
            if (isCorrect) letterBgClass = "bg-green-500";
            else if (isWrong) letterBgClass = "bg-red-400";

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => onSelect(option.choice_letter)}
                className={`flex w-full items-stretch overflow-hidden rounded-lg border-2 text-left transition ${borderClass}`}
              >
                <span className={`flex w-12 shrink-0 items-center justify-center text-base font-bold text-white ${letterBgClass}`}>
                  {letter}
                </span>
                <span className="flex flex-1 items-center px-4 py-3 text-sm text-gray-800">
                  {option.choice_text}
                </span>
              </button>
            );
          })}
        </div>

        <p className="mt-4 text-right text-xs text-gray-400">
          Partie {question.part_number} · {question.question_number} /{" "}
          {totalQuestions}
        </p>
      </div>
    </div>
  );
}
