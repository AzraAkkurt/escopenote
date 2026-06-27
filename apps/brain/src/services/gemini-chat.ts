import type { ServerResponse } from 'node:http';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { ChatStreamRequest } from '@escopenote/contracts';
import { config } from '../config.js';
import type { TokenUsage } from './billing.js';
import { estimateTokensFromText } from './billing.js';
import {
  buildSystemInstruction,
  buildUserPrompt,
  citationsFromReferences,
  sanitizeChatOutput,
  toGeminiHistory,
} from './chat-prompt.js';
import { endSse, initSse, writeSse } from '../sse.js';

function sanitizeGeminiError(err: unknown): string {
  const raw = err instanceof Error ? err.message : 'Gemini request failed';
  if (raw.includes('API key not valid') || raw.includes('API_KEY_INVALID')) {
    return 'Gemini API key is invalid or missing on the server.';
  }
  if (raw.includes('429') || raw.includes('RESOURCE_EXHAUSTED')) {
    return 'AI provider rate limit exceeded. Try again later.';
  }
  return 'AI provider is temporarily unavailable.';
}

export async function streamChatGemini(
  body: ChatStreamRequest,
  res: ServerResponse,
  options?: { leaveOpen?: boolean },
): Promise<TokenUsage> {
  const chunks = body.relevant_chunks ?? [];
  const useWebStyle = chunks.length === 0;
  const userPrompt = buildUserPrompt(body.message, chunks);
  const geminiHistory = toGeminiHistory(body.history ?? []);

  initSse(res);

  if (useWebStyle) {
    writeSse(res, {
      type: 'research',
      query: body.message.slice(0, 80),
      snippet: 'No local chunks provided; answering from general knowledge.',
    });
  } else {
    writeSse(res, {
      type: 'thinking',
      delta: `Using ${chunks.length} excerpt(s) from your library.\n`,
    });
  }

  const genAI = new GoogleGenerativeAI(config.geminiApiKey);
  const model = genAI.getGenerativeModel({
    model: config.geminiModel,
    systemInstruction: buildSystemInstruction(body.locale),
  });

  let fullText = '';
  let usage: TokenUsage = estimateTokensFromText(body.message);
  try {
    const result =
      geminiHistory.length > 0
        ? await model.startChat({ history: geminiHistory }).sendMessageStream(userPrompt)
        : await model.generateContentStream(userPrompt);

    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (!text) {
        continue;
      }
      fullText += text;
      writeSse(res, { type: 'delta', delta: text });
    }
    const response = await result.response;
    const meta = response.usageMetadata;
    if (meta) {
      usage = {
        inputTokens: meta.promptTokenCount ?? usage.inputTokens,
        outputTokens: meta.candidatesTokenCount ?? estimateTokensFromText(fullText).outputTokens,
      };
    } else {
      usage = {
        inputTokens: usage.inputTokens,
        outputTokens: estimateTokensFromText(fullText).outputTokens,
      };
    }
  } catch (err) {
    writeSse(res, {
      type: 'error',
      error: {
        code: 'PROVIDER_UNAVAILABLE',
        message: sanitizeGeminiError(err),
        retryable: false,
      },
    });
    endSse(res);
    throw err;
  }

  const cleaned = sanitizeChatOutput(fullText, chunks);
  const sourceType = useWebStyle ? 'web' : 'local';
  writeSse(res, {
    type: 'done',
    content: cleaned,
    sourceType,
    citations: chunks.length ? citationsFromReferences(cleaned, chunks) : undefined,
    ...(useWebStyle && cleaned
      ? {
          pendingWebSave: {
            title: `Web: ${body.message.slice(0, 48).trim()}`,
            summary: cleaned.slice(0, 2000),
          },
        }
      : {}),
  });
  if (!options?.leaveOpen) {
    endSse(res);
  }
  return usage;
}
