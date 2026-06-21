import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || "gemini-2.0-flash" });

export async function extractOptionsFromText(text: string) {
  // 1. Try Fast Manual Parsing for various OCR formats
  const parsedOptions: any[] = [];
  
  // Regex này tìm tất cả các cặp (Chữ cái) (Nội dung) trong toàn bộ văn bản
  // Hỗ trợ cả trường hợp "A nội dung B nội dung" trên cùng 1 dòng
  const globalRegex = /([A-D])[\s\.\)-]+(.*?)(?=(?:\s+[A-D][\s\.\)-])|$)/gi;
  
  let match;
  while ((match = globalRegex.exec(text)) !== null) {
    const letter = match[1].toUpperCase();
    const content = match[2].trim();
    
    // Chỉ thêm nếu chữ cái chưa tồn tại (tránh trùng lặp nếu OCR quét nhầm)
    if (!parsedOptions.find(o => o.choice_letter === letter)) {
      parsedOptions.push({
        choice_letter: letter,
        choice_text: content
      });
    }
  }

  // Nếu vẫn không tìm thấy đủ bằng regex global, thử cách quét từng dòng kiểu Letter -> Next Line
  if (parsedOptions.length !== 4) {
    const lines = text.split(/\n+/).map(l => l.trim()).filter(l => l);
    const lineParsed: any[] = [];
    const justLetterRegex = /^([A-D])[\.\)-]?$/i;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const m = line.match(justLetterRegex);
      if (m && i + 1 < lines.length) {
        const nextLine = lines[i + 1];
        if (!nextLine.match(justLetterRegex)) {
          const letter = m[1].toUpperCase();
          if (!lineParsed.find(o => o.choice_letter === letter)) {
            lineParsed.push({ choice_letter: letter, choice_text: nextLine.trim() });
            i++;
          }
        }
      }
    }
    if (lineParsed.length === 4) return lineParsed;
  }

  // If we found exactly 4 options via manual parsing, return immediately
  if (parsedOptions.length === 4) {
    return parsedOptions;
  }

  // 2. Fallback to AI if manual parsing fails or is incomplete
  const prompt = `



    You are an assistant helping to standardize data for French multiple-choice questions (TCF - Test de connaissance du français).
    Below is raw text extracted from an image (OCR) of a multiple-choice question.
    The text might be messy: multiple options might be on one line, or letters (A, B, C, D) might be listed first followed by a block of answer texts.
    
    Please extract the 4 answer options (A, B, C, D) from this text and map them correctly.

    Requirements:
    1. Return a JSON array of 4 objects, each containing:
       - choice_letter: 'A', 'B', 'C', or 'D'
       - choice_text: The content of the answer (fix any typos if possible, language is French)
    2. Even if the text is fragmented, ensure you return exactly 4 options.
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
