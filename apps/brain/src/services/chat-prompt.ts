import { randomUUID } from 'node:crypto';
import type { ChatCitation, ChatHistoryMessage, RelevantChunkInput } from '@escopenote/contracts';

const MAX_HISTORY_MESSAGES = 12;
const MAX_HISTORY_CHARS = 2000;

export function trimChatHistory(history: ChatHistoryMessage[]): ChatHistoryMessage[] {
  return history
    .slice(-MAX_HISTORY_MESSAGES)
    .map((entry) => ({
      role: entry.role,
      content: entry.content.slice(0, MAX_HISTORY_CHARS).trim(),
    }))
    .filter((entry) => entry.content.length > 0);
}

export function toGeminiHistory(history: ChatHistoryMessage[]): Array<{
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}> {
  return trimChatHistory(history).map((entry) => ({
    role: entry.role === 'user' ? 'user' : 'model',
    parts: [{ text: entry.content }],
  }));
}

export function buildSystemInstruction(locale?: string): string {
  const isTr = locale === 'tr';
  const lang = isTr ? 'Turkish' : 'English';
  const notFound = isTr
    ? 'Bu bilgi kütüphanenizdeki alıntılarda yok.'
    : 'This information is not in your library excerpts.';

  return [
    `You are Escopenote study assistant. Answer in ${lang} unless the user writes in another language.`,
    'Use Markdown in answers: **bold**, *italic*, `code`, bullet lists when helpful.',
    'When library excerpts are provided:',
    '- Answer ONLY from those excerpts. Cite them inline as [1], [2], etc.',
    '- Never write file=, chunkId=, or raw metadata in the answer.',
    '- Never invent filenames, document names, or numeric values not present in the excerpts.',
    `- If the excerpts do not contain the answer, say clearly: "${notFound}" Do not guess.`,
    'When no excerpts are provided, answer from general knowledge and do not cite local files.',
    'Use the conversation history to resolve follow-up questions, pronouns, and earlier topics.',
    'Be concise and accurate.',
  ].join(' ');
}

export function buildUserPrompt(message: string, chunks: RelevantChunkInput[]): string {
  if (chunks.length === 0) {
    return message;
  }

  const context = chunks
    .map((c, i) => `[${i + 1}] "${c.fileName}"\n${c.text.slice(0, 4000)}`)
    .join('\n\n---\n\n');

  return [
    'Library excerpts (these are the ONLY local sources — cite as [1], [2], …):',
    '',
    context,
    '',
    '---',
    '',
    'Question:',
    message,
  ].join('\n');
}

export function sanitizeChatOutput(text: string, chunks: RelevantChunkInput[]): string {
  let out = text;

  out = out.replace(/\s*\(?file="[^"]*"(?:,\s*chunkId="[^"]*")?\)?\.?/gi, '');
  out = out.replace(/\s*\(chunkId="[^"]*"\)/gi, '');

  const allowedFiles = new Set(chunks.map((c) => c.fileName.toLowerCase()));
  out = out.replace(/\(([a-zA-Z0-9_\-.]+\.(?:txt|md|pdf|docx?))\)/gi, (match, fname: string) => {
    if (allowedFiles.has(fname.toLowerCase())) {
      return match;
    }
    return '';
  });

  return out.replace(/[ \t]{2,}/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
}

export function citationsFromReferences(
  text: string,
  chunks: RelevantChunkInput[],
): ChatCitation[] {
  const refs = new Set<number>();
  for (const match of text.matchAll(/\[(\d+)\]/g)) {
    const n = Number.parseInt(match[1], 10);
    if (n >= 1 && n <= chunks.length) {
      refs.add(n - 1);
    }
  }

  if (refs.size === 0) {
    return [];
  }

  return [...refs]
    .sort((a, b) => a - b)
    .map((i) => ({
      id: `cit_${randomUUID().slice(0, 8)}`,
      chunkId: chunks[i].chunkId,
      sourceType: 'local' as const,
      fileName: chunks[i].fileName,
      excerpt: chunks[i].text.slice(0, 320).trim() + (chunks[i].text.length > 320 ? '…' : ''),
    }));
}
