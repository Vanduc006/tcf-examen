import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Anthropic from "@anthropic-ai/sdk";
import type { ExtractedQuestion } from "./types";

const SYSTEM_PROMPT = `You are an expert transcriber and French language teacher. You will receive a WEBVTT subtitle file from a TCF (Test de Connaissance du Français) "Compréhension Orale" (Listening) practice exam from YouTube.

Parse the transcript and extract the questions, their spoken options, and the timestamp where each question begins.

Structure of the TCF Compréhension Orale exam:
- Typically 30-39 questions across 4 parts (A1 to C2).
- Part 1: Images (Questions 1-4/5)
- Part 2: Short audio exchanges (Questions 6-15)
- Part 3: Short conversations (Questions 16-25)
- Part 4: Longer presentations (Questions 26-39)

Return ONLY valid JSON with this shape:
{
  "questions": [
    {
      "question_number": 1,
      "timestamp_start": "00:00:15",
      "question_text": "regardez l'image 1",
      "transcript": "Bonjour, asseyez-vous je vous en prie...",
      "part_number": 1,
      "options": [
        { "choice_letter": "A", "choice_text": "allez-y", "is_correct": false },
        { "choice_letter": "B", "choice_text": "asseyez-vous je vous en prie", "is_correct": false },
        { "choice_letter": "C", "choice_text": "fermez la porte s'il vous plaît", "is_correct": false },
        { "choice_letter": "D", "choice_text": "merci pour ce café", "is_correct": false }
      ]
    }
  ]
}

Rules:
- CRITICAL TIMESTAMPS: The timestamp_start MUST be the exact time when the AUDIO SEGMENT or DIALOGUE for that question begins. DO NOT just use the timestamp where the narrator says "Question X". The test taker must hear the entire dialogue piece to answer the question! Therefore, always trace back to the very first spoken line of the dialogue/text corresponding to the question.
- EXACT TRANSCRIPT: In the "transcript" field, capture the exact original text of the audio dialogue corresponding to the question.
- Each question must have exactly 4 options (A, B, C, D).
- As an expert French teacher, you MUST deduce and identify the correct answer for each question based on the transcript's dialogues, context, and questions. Set exactly one option's is_correct to true, and the rest to false.
- For Part 1 (Images), since you cannot see the images, use your best logical deduction based on the audio cues to determine the most plausible answer.
- Normalize choice_letter to uppercase A, B, C, D.
- timestamp_start format: HH:MM:SS or MM:SS`;

const CHUNK_SIZE = 80000;

function chunkVtt(vtt: string): string[] {
  if (vtt.length <= CHUNK_SIZE) return [vtt];

  const chunks: string[] = [];
  let start = 0;
  while (start < vtt.length) {
    let end = Math.min(start + CHUNK_SIZE, vtt.length);
    if (end < vtt.length) {
      const lastNewline = vtt.lastIndexOf("\n\n", end);
      if (lastNewline > start) end = lastNewline;
    }
    chunks.push(vtt.slice(start, end));
    start = end;
  }
  return chunks;
}

function parseQuestions(content: string): ExtractedQuestion[] {
  const parsed = JSON.parse(content) as { questions?: ExtractedQuestion[] };
  if (!Array.isArray(parsed.questions)) {
    throw new Error("LLM response missing questions array");
  }
  return parsed.questions;
}

function mergeQuestions(chunks: ExtractedQuestion[][]): ExtractedQuestion[] {
  const map = new Map<number, ExtractedQuestion>();
  for (const batch of chunks) {
    for (const q of batch) {
      if (!map.has(q.question_number)) {
        map.set(q.question_number, q);
      }
    }
  }
  return [...map.values()].sort((a, b) => a.question_number - b.question_number);
}

async function generateWithGemini(systemPrompt: string, userPrompt: string, modelType: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: modelType,
    systemInstruction: systemPrompt,
    generationConfig: { responseMimeType: "application/json" },
  });
  const result = await model.generateContent(userPrompt);
  return result.response.text();
}

async function generateWithClaude(systemPrompt: string, userPrompt: string, modelType: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured");
  const anthropic = new Anthropic({ apiKey });
  const msg = await anthropic.messages.create({
    model: modelType,
    max_tokens: 4096,
    temperature: 0.1,
    system: systemPrompt,
    messages: [
      { role: "user", content: userPrompt + "\n\nCRITICAL: Return ONLY a valid JSON object." }
    ]
  });
  return (msg.content[0] as any).text;
}

export async function extractQuestionsFromVtt(
  vtt: string,
  provider: "openai" | "gemini" | "claude" = "openai"
): Promise<ExtractedQuestion[]> {
  const chunks = chunkVtt(vtt);
  const results: ExtractedQuestion[][] = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunkPrompt =
      chunks.length > 1
        ? `This is chunk ${i + 1} of ${chunks.length} of the VTT file. Extract all questions found in this chunk.\n\n`
        : "";

    const userPrompt = `${chunkPrompt}Here is the WEBVTT data:\n\n${chunks[i]}`;
    let content: string | undefined;

    if (provider === "openai") {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");
      const client = new OpenAI({ apiKey });
      const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

      const response = await client.chat.completions.create({
        model,
        temperature: 0.1,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
      });
      content = response.choices[0]?.message?.content || undefined;
    } else if (provider === "gemini") {
      const model = process.env.GEMINI_MODEL || "gemini-3.5-flash";
      content = await generateWithGemini(SYSTEM_PROMPT, userPrompt, model);
    } else if (provider === "claude") {
      const model = process.env.CLAUDE_MODEL || "claude-3-5-sonnet-20241022";
      content = await generateWithClaude(SYSTEM_PROMPT, userPrompt, model);
    }

    if (!content) {
      throw new Error(`Empty response from ${provider}`);
    }
    
    content = content.trim();
    if (content.startsWith("\`\`\`json")) {
      content = content.replace(/^\`\`\`json\s*/, "").replace(/\s*\`\`\`$/, "");
    }

    results.push(parseQuestions(content));
  }

  const merged = mergeQuestions(results);
  if (merged.length === 0) {
    throw new Error("No questions extracted from subtitles");
  }

  return merged;
}
