import fs from 'fs';
import { GoogleGenerativeAI } from '@google/generative-ai';
import logger from '../config/logger.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Builds the prompt for Gemini legal document analysis.
 */
const buildPrompt = (fileName) => `
You are an expert Indian legal analyst and senior advocate with 30 years of experience 
in civil, criminal, and corporate law. You specialize in analyzing legal documents and 
explaining them in clear, simple language that clients and junior lawyers can understand.

Your task is to analyze the attached PDF document and return a structured JSON 
analysis. You must return ONLY a valid JSON object — no markdown code fences, no 
explanatory text before or after the JSON, just the raw JSON object starting with { 
and ending with }.

The JSON must follow this exact structure:
{
  "documentType": "string — type of legal document (FIR / Charge Sheet / Bail Application / Contract / Court Order / Legal Notice / Judgment / Petition / Affidavit / Agreement / Other)",
  "executiveSummary": "string — 3 to 5 paragraph plain English summary of the entire document. Write as if explaining to a client who has no legal background. Be specific about what is happening, who is involved, and what the stakes are.",
  "riskLevel": "critical | high | medium | low",
  "riskRationale": "string — one paragraph explaining why you assigned this risk level",
  "parties": [
    {
      "name": "string — full name of party",
      "role": "string — Petitioner / Respondent / Accused / Complainant / Witness / Advocate / Judge / Other"
    }
  ],
  "clauses": [
    {
      "title": "string — short descriptive title of this clause or charge",
      "content": "string — plain English explanation of what this clause means and its implications",
      "importance": "critical | high | medium | low",
      "category": "charge | obligation | deadline | penalty | right | definition | party | jurisdiction | evidence | other"
    }
  ],
  "keyDates": [
    {
      "label": "string — what this date represents",
      "date": "string — the date as it appears in the document",
      "context": "string — why this date matters"
    }
  ],
  "legalReferences": [
    {
      "section": "string — e.g. Section 302 IPC or Article 21 Constitution",
      "description": "string — what this section says in plain English",
      "relevance": "string — why this section is cited in this document"
    }
  ],
  "actionItems": [
    {
      "action": "string — specific action the lawyer must take",
      "urgency": "immediate | soon | normal"
    }
  ]
}

Rules:
- Extract ALL charges, sections, and legal references — miss nothing
- Flag critical items (bail conditions, punishment ranges, deadlines) as "critical" importance
- Write all content fields in clear, jargon-free English
- If the document is in Hindi or a regional language, still respond in English
- If the PDF is a scanned image, use your OCR capabilities to read it and note any quality issues in executiveSummary
- Minimum 5 clauses, maximum 30 clauses
- Keep each clause content between 50 and 300 words
- Return ONLY raw JSON — absolutely no markdown, no backticks, no code fences
- If any field cannot be determined, return null for that field rather than omitting it entirely

File name: ${fileName}

Analyze the attached PDF and return the JSON analysis now.
`;

/**
 * Analyzes a legal PDF document by sending the raw file to Gemini's multimodal API.
 * This approach skips pdf-parse entirely — Gemini natively reads PDFs including scanned ones.
 *
 * @param {string} filePath — absolute path to the PDF file on disk
 * @param {string} fileName — original file name for context
 * @returns {object} parsed analysis object
 */
export const analyzeDocument = async (filePath, fileName) => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('Missing GEMINI_API_KEY in environment variables');
  }

  // Read the PDF file and convert to base64 for Gemini's inline_data format
  if (!fs.existsSync(filePath)) {
    throw new Error(`PDF file not found at path: ${filePath}`);
  }

  const pdfBuffer = await fs.promises.readFile(filePath);
  const pdfBase64 = pdfBuffer.toString('base64');

  const startTime = Date.now();

  // Use gemini-2.5-flash — fast, multimodal, native PDF support
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      temperature: 0.1,        // low temperature for consistent, factual output
      topP: 0.8,
      topK: 40,
      maxOutputTokens: 8192,
      responseMimeType: 'application/json',
    },
  });

  const prompt = buildPrompt(fileName);

  let response;
  try {
    const result = await model.generateContent([
      { text: prompt },
      {
        inlineData: {
          mimeType: 'application/pdf',
          data: pdfBase64,
        },
      },
    ]);
    response = result.response;
  } catch (err) {
    logger.error('Gemini API call failed', { error: err.message });
    throw new Error(`Gemini API error: ${err.message}`);
  }

  const processingTimeMs = Date.now() - startTime;

  const rawText = response?.text?.()?.trim() || '';
  if (!rawText) {
    throw new Error('Empty response received from Gemini API');
  }

  // Extract JSON from the response (safety fallback for markdown fences)
  let jsonText = rawText;
  const startIdx = jsonText.indexOf('{');
  const endIdx = jsonText.lastIndexOf('}');

  if (startIdx !== -1 && endIdx !== -1) {
    jsonText = jsonText.substring(startIdx, endIdx + 1);
  } else {
    jsonText = jsonText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
  }

  let parsed;
  try {
    parsed = JSON.parse(jsonText);
  } catch (e) {
    logger.error('Gemini response was not valid JSON', {
      preview: rawText.slice(0, 300),
      error: e.message,
    });
    throw new Error('Gemini returned invalid JSON — analysis failed');
  }

  // Extract token usage if available
  const tokensUsed = response?.usageMetadata
    ? (response.usageMetadata.promptTokenCount || 0) +
    (response.usageMetadata.candidatesTokenCount || 0)
    : null;

  return {
    ...parsed,
    processingTimeMs,
    tokensUsed,
  };
};
