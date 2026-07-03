import { ANTHROPIC_API_URL, ANTHROPIC_MAX_TOKENS, ANTHROPIC_VERSION } from '../constants/config';

export interface AnthropicTurn {
  role: 'user' | 'assistant';
  content: string;
}

interface AnthropicContentBlock {
  type: string;
  text?: string;
}

interface AnthropicResponseBody {
  content?: AnthropicContentBlock[];
  error?: { message?: string; type?: string };
}

/**
 * Direct REST call to the Anthropic Messages API.
 *
 * The official `@anthropic-ai/sdk` targets Node/browser runtimes (it assumes
 * Node's `http`/stream primitives and guards browser usage behind
 * `dangerouslyAllowBrowser`), which don't map cleanly onto React Native's
 * JS engine. Calling the REST endpoint with `fetch` directly is the
 * standard approach for mobile clients.
 */
export async function callClaude({
  apiKey,
  model,
  systemPrompt,
  messages,
  maxTokens = ANTHROPIC_MAX_TOKENS,
}: {
  apiKey: string;
  model: string;
  systemPrompt: string;
  messages: AnthropicTurn[];
  maxTokens?: number;
}): Promise<string> {
  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': ANTHROPIC_VERSION,
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages,
    }),
  });

  const body = (await response.json()) as AnthropicResponseBody;

  if (!response.ok) {
    const message = body.error?.message ?? `Error HTTP ${response.status}`;
    throw new Error(`Claude API: ${message}`);
  }

  const textBlock = body.content?.find((block) => block.type === 'text' && block.text);
  if (!textBlock?.text) {
    throw new Error('Claude API: respuesta sin contenido de texto.');
  }
  return textBlock.text;
}
