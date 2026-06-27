import type { ChatCitation, SourceType } from '@shared/chat-types';
import type { RelevantChunk } from '@shared/rag-types';
import { createCitationId } from './defaults';

function delay(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }
    const id = window.setTimeout(() => {
      if (signal.aborted) {
        reject(new DOMException('Aborted', 'AbortError'));
      } else {
        resolve();
      }
    }, ms);
    signal.addEventListener(
      'abort',
      () => {
        window.clearTimeout(id);
        reject(new DOMException('Aborted', 'AbortError'));
      },
      { once: true },
    );
  });
}

function buildAnswer(chunks: RelevantChunk[]): string {
  if (chunks.length === 0) {
    return '';
  }

  const intro =
    'Based on the excerpts retrieved from your knowledge library on this device:\n\n';
  const bullets = chunks
    .map((c, i) => `${i + 1}. (${c.fileName}) ${c.text.slice(0, 220).trim()}${c.text.length > 220 ? '…' : ''}`)
    .join('\n');

  return `${intro}${bullets}\n\n(Phase 9 will send only these excerpts to the AI gateway — not full files.)`;
}

function chunksToCitations(chunks: RelevantChunk[]): ChatCitation[] {
  return chunks.map((chunk) => ({
    id: createCitationId(),
    chunkId: chunk.chunkId,
    sourceType: 'local' as const,
    fileName: chunk.fileName,
    excerpt: chunk.text.slice(0, 320).trim() + (chunk.text.length > 320 ? '…' : ''),
  }));
}

export async function streamRagAssistant(
  chunks: RelevantChunk[],
  onChunk: (text: string) => void,
  signal: AbortSignal,
): Promise<{ content: string; citations: ChatCitation[]; sourceType: SourceType }> {
  const full = buildAnswer(chunks);
  const tokens = full.split(/(\s+|\n)/).filter((t) => t.length > 0);
  let built = '';

  for (const token of tokens) {
    await delay(18 + Math.random() * 14, signal);
    built += token;
    onChunk(built);
  }

  return {
    content: built.trim(),
    citations: chunksToCitations(chunks),
    sourceType: 'local',
  };
}

export async function streamEmptyRetrieval(
  onChunk: (text: string) => void,
  signal: AbortSignal,
): Promise<{ content: string; citations: ChatCitation[]; sourceType: SourceType }> {
  const text =
    'I searched your local knowledge library but did not find relevant excerpts for this question. ' +
    'Add or index documents in the Library, or try rephrasing. Web fallback arrives in Phase 9.';
  const tokens = text.split(/(\s+)/).filter((t) => t.length > 0);
  let built = '';
  for (const token of tokens) {
    await delay(22, signal);
    built += token;
    onChunk(built);
  }
  return { content: built.trim(), citations: [], sourceType: 'local' };
}
