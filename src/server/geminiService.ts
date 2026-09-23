import { GoogleGenAI } from '@google/genai';

let aiInstance: GoogleGenAI | null = null;

function getAI(): GoogleGenAI {
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiInstance;
}

export interface DigitizedEntry {
  suggestedDrawId?: string;
  result: number;
  confidence: number;
  rawText: string;
}

/**
 * Digitizes handwritten or screenshot lottery numbers using Gemini vision
 */
export async function digitizeLotteryImage(
  base64Data: string,
  mimeType: string = 'image/jpeg'
): Promise<DigitizedEntry[]> {
  const ai = getAI();

  const prompt = `You are a specialized OCR assistant for handwritten and printed WinGo / lottery records.
Analyze this image carefully. The image contains lottery draws and numbers (for example handwritten columns, fractions like 10/9, 2/4, 4/7, or sequential tables of numbers 0 to 9).

Extract every lottery result number (integers 0 to 9 only).
If pairs like 2/4 are found:
- The numerator/denominator or sequential entries each represent lottery numbers or (Draw# / Result#).
- For each lottery result identified, produce an entry with the integer 0-9.

Return a JSON array of objects with the following schema:
[
  {
    "suggestedDrawId": "optional identifier or index if visible, else null",
    "result": integer between 0 and 9,
    "confidence": integer between 50 and 99,
    "rawText": "exact text detected (e.g. '2/4' or '4')"
  }
]
Return ONLY valid JSON array with no extra markdown text.`;

  const cleanBase64 = base64Data.replace(/^data:image\/[a-z]+;base64,/, '');

  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: {
      parts: [
        {
          inlineData: {
            mimeType,
            data: cleanBase64,
          },
        },
        {
          text: prompt,
        },
      ],
    },
    config: {
      responseMimeType: 'application/json',
      temperature: 0.1,
    },
  });

  const rawJson = response.text || '[]';
  try {
    const parsed = JSON.parse(rawJson);
    if (Array.isArray(parsed)) {
      return parsed
        .filter(item => typeof item.result === 'number' && item.result >= 0 && item.result <= 9)
        .map((item, idx) => ({
          suggestedDrawId: item.suggestedDrawId || `DRAW-${Date.now()}-${idx + 1}`,
          result: Math.floor(item.result),
          confidence: Math.min(100, Math.max(0, item.confidence || 85)),
          rawText: String(item.rawText || item.result),
        }));
    }
  } catch (err) {
    console.error('Failed to parse Gemini OCR output:', err, rawJson);
  }

  return [];
}

/**
 * Explains statistical models without fabricating numbers
 */
export async function explainStatisticalAnalysis(payload: {
  previousResult: number | null;
  currentSequence: string;
  topCandidates: { number: number; score: number; count: number; percentage: number }[];
  modelAgreement: number;
  sampleSize: number;
  backtestTop1Rate: number;
  backtestTop3Rate: number;
}): Promise<string> {
  const ai = getAI();

  const prompt = `You are the chief mathematical analyst for the WIN GO AI VIP ANALYTICAL ENGINE.
Explain the following verified statistical data to the VIP researcher.

FACTUAL COMPUTED DATA:
- Latest previous result: ${payload.previousResult ?? 'N/A'}
- Current sequence: ${payload.currentSequence}
- Top Historical Candidates:
${payload.topCandidates.map(c => `  Candidate ${c.number}: Model Score ${c.score}/100 | Historical transition count: ${c.count} (${c.percentage}%)`).join('\n')}
- Model Agreement: ${payload.modelAgreement}%
- Historical sample size: ${payload.sampleSize} draws
- Walk-forward backtest Top-1 hit rate: ${payload.backtestTop1Rate}%
- Walk-forward backtest Top-3 hit rate: ${payload.backtestTop3Rate}%

STRICT CONSTRAINTS:
1. Do NOT invent or alter any numbers. Rely strictly on the numbers provided above.
2. NEVER use words like "100% sure", "guaranteed win", "fixed number", "sure shot", or "guaranteed prediction".
3. Use terms like "Statistical Candidate", "Historical Probability", "Pattern Signal", "Model Score", "Transition Frequency".
4. State whether the sample size is sufficient (${payload.sampleSize >= 100 ? 'Expanded sample' : payload.sampleSize >= 30 ? 'Moderate sample' : 'Small sample - caution advised'}).
5. Summarize the transition dynamics: why Candidate ${payload.topCandidates[0]?.number ?? 'X'} scored highest based on transition frequency and sequence continuity.
6. Provide a concise, VIP, high-end quantitative breakdown formatted with clean bullet points and markdown.
7. Include the mandatory brief research disclaimer at the bottom.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: prompt,
    config: {
      temperature: 0.2,
    },
  });

  return response.text || 'Statistical breakdown unavailable.';
}
