import Anthropic from '@anthropic-ai/sdk';

/**
 * Reusable Claude (Anthropic API) client for server-side AI features.
 * Same lazy-init pattern as questions/aiSuggest.ts's OpenAI client, so
 * both providers behave consistently (fail at first real use, not at
 * server boot, when the key is missing).
 *
 * Per this project's AI-assist policy: any AI output used here may only
 * ever be a *draft* for a human to confirm -- never written directly to
 * a field a student/user sees, never auto-published. That's enforced by
 * each caller (e.g. writing to a `suggested*` column, not the real one),
 * not by this client.
 */

const DEFAULT_MODEL = 'claude-opus-5';

let client: Anthropic | null = null;
function getClient(): Anthropic {
  if (client) return client;
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is not set');
  }
  client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}

export type AskClaudeOptions = {
  model?: string;
  maxTokens?: number;
  system?: string;
};

/**
 * Minimal convenience wrapper: send one user turn, get back the
 * concatenated text of the response. Not for multi-turn conversations or
 * tool use -- call `getClaudeClient().messages.create(...)` directly for
 * those, using the full Anthropic SDK types.
 */
export async function askClaude(prompt: string, options: AskClaudeOptions = {}): Promise<string> {
  const response = await getClient().messages.create({
    model: options.model ?? DEFAULT_MODEL,
    max_tokens: options.maxTokens ?? 4096,
    ...(options.system ? { system: options.system } : {}),
    messages: [{ role: 'user', content: prompt }],
  });

  return response.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('\n');
}

/** For callers that need the full SDK surface (streaming, tool use, multi-turn, etc.). */
export function getClaudeClient(): Anthropic {
  return getClient();
}
