import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || "gemini-2.0-flash" });

export async function extractOptionsFromText(text: string) {
  // 1. Try Fast Regex Parsing for clean OCR formats (like A content, B content...)
  const lines = text.split(/\n+/).map(l => l.trim()).filter(l => l);
  const regex = /^([A-D])[\s\.\)-]+(.+)$/i;
  const parsedOptions: any[] = [];
  
  for (const line of lines) {
    const match = line.match(regex);
    if (match) {
      parsedOptions.push({
        choice_letter: match[1].toUpperCase(),
        choice_text: match[2].trim()
      });
    }
  }

  // If we found exactly 4 options via regex, return immediately (fast & free)
  if (parsedOptions.length === 4) {
    return parsedOptions;
  }

  // 2. Fallback to AI if regex parsing fails or is incomplete
  const prompt = `

    You are an assistant helping to standardize data for French multiple-choice questions (TCF - Test de connaissance du français).
    Below is raw text extracted from an image (OCR) of a multiple-choice question.
    Please extract the 4 answer options (A, B, C, D) from this text.

    Requirements:
    1. Return a JSON array of 4 objects, each containing:
       - choice_letter: 'A', 'B', 'C', or 'D'
       - choice_text: The content of the answer (fix any typos if possible, language is French)
    2. If you cannot find all 4 options, try to infer them or leave the text empty.
    3. Return ONLY the JSON array, no other text.

    OCR Text:
    """
    ${text}
    """
  `;


  const result = await model.generateContent(prompt);
  const responseText = result.response.text();
  
  // Clean JSON response (remove markdown code blocks if present)
  const jsonMatch = responseText.match(/\[[\s\S]*\]/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }
  return JSON.parse(responseText);
}

export async function extractOptionsFromImage(base64Image: string) {
  const prompt = `
    You are an assistant helping to standardize data for French multiple-choice questions (TCF - Test de connaissance du français).
    Please look at the image and extract the 4 answer options (A, B, C, D).

    Requirements:
    1. Return a JSON array of 4 objects, each containing:
       - choice_letter: 'A', 'B', 'C', or 'D'
       - choice_text: The content of the answer (language is French)
    2. Return ONLY the JSON array, no other text.
  `;


  const result = await model.generateContent([
    prompt,
    {
      inlineData: {
        data: base64Image.split(",")[1] || base64Image,
        mimeType: "image/png",
      },
    },
  ]);
  
  const responseText = result.response.text();
  const jsonMatch = responseText.match(/\[[\s\S]*\]/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }
  return JSON.parse(responseText);
}
