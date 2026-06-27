import { randomUUID } from 'node:crypto';
import type { ServerResponse } from 'node:http';
import type { ChatStreamRequest, RelevantChunkInput } from '@escopenote/contracts';
import type { TokenUsage } from './billing.js';
import { estimateTokensFromText } from './billing.js';
import { citationsFromReferences } from './chat-prompt.js';
import { endSse, initSse, writeSse } from '../sse.js';

function buildLocalAnswer(message: string, chunks: RelevantChunkInput[]): string {
  const intro = 'Kütüphanenizdeki alıntılara göre:\n\n';
  const body = chunks
    .map((c, i) => `${i + 1}. **${c.fileName}**: ${c.text.slice(0, 280).trim()}`)
    .join('\n\n');
  return `${intro}${body}\n\n_Soru: ${message.slice(0, 200)}_`;
}

function buildWebAnswer(message: string): string {
  return (
    `I could not find enough local context for: "${message.slice(0, 120)}". ` +
    `Here is a concise summary from public sources (brain mock — set GEMINI_API_KEY for real answers). ` +
    `You can save this to your library for future on-device retrieval.`
  );
}

function citationsFromChunks(chunks: RelevantChunkInput[], text: string) {
  return citationsFromReferences(text, chunks);
}

export async function streamChatMock(
  body: ChatStreamRequest,
  res: ServerResponse,
  options?: { leaveOpen?: boolean },
): Promise<TokenUsage> {
  const chunks = body.relevant_chunks ?? [];
  const forceWeb = /\b(web|internet|search online|i̇nternet)\b/i.test(body.message);
  const useWeb = forceWeb || chunks.length === 0;

  initSse(res);

  if (useWeb) {
    writeSse(res, {
      type: 'research',
      query: body.message.slice(0, 80),
      snippet: 'Searching public sources for additional context…',
    });
    await delay(150);
    writeSse(res, {
      type: 'thinking',
      delta: 'Local knowledge is insufficient. Reviewing web results and synthesizing an answer.\n',
    });
    await delay(100);
  } else if (chunks.length > 0) {
    writeSse(res, {
      type: 'thinking',
      delta: `Found ${chunks.length} relevant chunk(s) in your library. Composing answer from sources.\n`,
    });
    await delay(80);
  }

  const full = useWeb ? buildWebAnswer(body.message) : buildLocalAnswer(body.message, chunks);
  const tokens = full.split(/(\s+|\n)/).filter((t) => t.length > 0);
  let built = '';

  for (const token of tokens) {
    built += token;
    writeSse(res, { type: 'delta', delta: token });
    await delay(8);
  }

  if (useWeb) {
    writeSse(res, {
      type: 'done',
      content: built.trim(),
      sourceType: 'web',
      thinking: 'Local RAG coverage was low; used web research to supplement the answer.',
      citations: [
        {
          id: `cit_${randomUUID().slice(0, 8)}`,
          sourceType: 'web',
          fileName: 'example.com/article',
          excerpt: 'Public article excerpt used when local RAG has insufficient coverage.',
        },
      ],
      pendingWebSave: {
        title: `Web: ${body.message.slice(0, 48).trim()}`,
        summary: `Summary for "${body.message.slice(0, 80)}": key facts gathered from web research (mock).`,
      },
    });
  } else {
    writeSse(res, {
      type: 'done',
      content: built.trim(),
      sourceType: 'local',
      citations: citationsFromChunks(chunks, built.trim()),
    });
  }

  const usage: TokenUsage = {
    inputTokens: estimateTokensFromText(body.message).inputTokens,
    outputTokens: estimateTokensFromText(built).outputTokens,
  };
  if (!options?.leaveOpen) {
    endSse(res);
  }
  return usage;
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
