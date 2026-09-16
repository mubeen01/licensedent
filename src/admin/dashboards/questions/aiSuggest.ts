import OpenAI from 'openai';
import { type ParsedOption } from './importParsing';

/**
 * TypeScript port of D:\Dental\tools\pdf_import\ai_suggest_answers.py's two
 * prompts, same model/temperature, so the in-app upload path and the
 * standalone batch script draft identically-styled suggestions. Per the
 * saved AI-assist policy: this only ever *drafts* — callers must write the
 * result to suggestedCorrectKey/suggestedExplanation, never to the real
 * correctKey/explanation columns the approve-guard trusts as confirmed.
 */

const MODEL = 'gpt-4.1-mini';
export const AI_SUGGESTION_SOURCE = `openai:${MODEL}`;

let client: OpenAI | null = null;
function getClient(): OpenAI {
  if (client) return client;
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set');
  }
  client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return client;
}

// Tag-drafting instructions shared by both prompts below -- kept as one block
// so the two prompts stay in sync instead of drifting. Bundled into the same
// call as the answer/explanation draft (not a separate AI request) to stay
// inside the existing "fraction of a cent per question" cost model.
const TAG_INSTRUCTIONS = `Also classify the question for a student-facing quiz filter:
- "difficulty": "easy", "medium", or "hard" -- easy = pure recall of a single fact, medium = requires connecting 2-3 concepts,
  hard = multi-step clinical reasoning or an easily-confused distractor set.
- "isHighYield": true if this tests a concept that shows up disproportionately often on real board exams (classic
  high-value topics), false otherwise.
- "isCaseBased": true if the stem describes a specific patient scenario/vignette rather than asking a direct factual question.`;

const SYSTEM_PROMPT = `You are assisting a dental board-exam question bank (NBDE Part II style, General Dentist track).
You will be given a multiple-choice question stem and its lettered options, sourced from a dental review book or recall PDF.
Pick the single best-answer option key, and write an explanation in the style of Mosby's Review for the NBDE Part II answer keys:
concise (2-4 sentences) for straightforward recall questions, longer (up to ~6-8 sentences) only when the question genuinely
requires clinical reasoning across multiple concepts. State the correct answer's rationale, and briefly note why the strongest
distractor(s) are wrong when that adds real value. Do not pad length for its own sake.

${TAG_INSTRUCTIONS}

Respond with ONLY a JSON object, no markdown fences, no commentary:
{"correctKey": "<option key exactly as given>", "explanation": "<your explanation>", "difficulty": "<easy|medium|hard>", "isHighYield": <true|false>, "isCaseBased": <true|false>}

If you are not reasonably confident in the correct answer, respond with:
{"correctKey": null, "explanation": null, "difficulty": null, "isHighYield": null, "isCaseBased": null}`;

const EXPLANATION_ONLY_SYSTEM_PROMPT = `You are assisting a dental board-exam question bank (NBDE Part II style, General Dentist track).
You will be given a multiple-choice question, its lettered options, and the CONFIRMED correct answer (already verified from the
source material -- do not second-guess it). Write only the explanation, in the style of Mosby's Review for the NBDE Part II
answer keys: concise (2-4 sentences) for straightforward recall questions, longer (up to ~6-8 sentences) only when the question
genuinely requires clinical reasoning across multiple concepts. State the rationale for the confirmed answer, and briefly note
why the strongest distractor(s) are wrong when that adds real value. Do not pad length for its own sake.

${TAG_INSTRUCTIONS}

Respond with ONLY a JSON object, no markdown fences, no commentary:
{"explanation": "<your explanation>", "difficulty": "<easy|medium|hard>", "isHighYield": <true|false>, "isCaseBased": <true|false>}`;

function optionsText(options: ParsedOption[]): string {
  return options.map((o) => `${o.key}. ${o.text}`).join('\n');
}

function parseJsonResponse(raw: string | null | undefined): any | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw.trim());
  } catch {
    return null;
  }
}

const VALID_DIFFICULTIES = new Set(['easy', 'medium', 'hard']);

export type SuggestedTags = {
  difficulty: 'easy' | 'medium' | 'hard' | null;
  isHighYield: boolean | null;
  isCaseBased: boolean | null;
};

// Best-effort: a malformed/missing tag from the model just means "no tag
// suggestion this time" (null), never a hard failure -- the answer/
// explanation draft (the part that actually gates approval) still stands on
// its own.
function extractSuggestedTags(parsed: any): SuggestedTags {
  return {
    difficulty: VALID_DIFFICULTIES.has(parsed?.difficulty) ? parsed.difficulty : null,
    isHighYield: typeof parsed?.isHighYield === 'boolean' ? parsed.isHighYield : null,
    isCaseBased: typeof parsed?.isCaseBased === 'boolean' ? parsed.isCaseBased : null,
  };
}

/** No confirmed answer at all — ask the model to pick a key AND explain it. */
export async function suggestAnswerAndExplanation(
  stem: string,
  options: ParsedOption[]
): Promise<({ correctKey: string; explanation: string } & SuggestedTags) | null> {
  const resp = await getClient().chat.completions.create({
    model: MODEL,
    temperature: 0.2,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: `Question:\n${stem}\n\nOptions:\n${optionsText(options)}` },
    ],
  });

  const parsed = parseJsonResponse(resp.choices[0]?.message?.content);
  if (!parsed || !parsed.correctKey || !parsed.explanation) return null;

  const validKeys = new Set(options.map((o) => o.key));
  if (!validKeys.has(parsed.correctKey)) return null;

  return { correctKey: parsed.correctKey, explanation: parsed.explanation, ...extractSuggestedTags(parsed) };
}

/** correctKey is already confirmed from the source — only draft the explanation. */
export async function suggestExplanationOnly(
  stem: string,
  options: ParsedOption[],
  confirmedCorrectKey: string
): Promise<({ explanation: string } & SuggestedTags) | null> {
  const resp = await getClient().chat.completions.create({
    model: MODEL,
    temperature: 0.2,
    messages: [
      { role: 'system', content: EXPLANATION_ONLY_SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Question:\n${stem}\n\nOptions:\n${optionsText(options)}\n\nConfirmed correct answer: ${confirmedCorrectKey}`,
      },
    ],
  });

  const parsed = parseJsonResponse(resp.choices[0]?.message?.content);
  if (!parsed?.explanation) return null;

  return { explanation: parsed.explanation, ...extractSuggestedTags(parsed) };
}
