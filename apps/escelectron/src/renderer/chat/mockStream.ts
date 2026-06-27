import type { ChatCitation, SourceType } from '@shared/chat-types';
import { createCitationId } from './defaults';

const MOCK_RESPONSE =
  'Based on your indexed materials, the key points are: review the syllabus sections marked for the exam, ' +
  'practice problems from chapter 3, and summarize definitions you highlighted. ' +
  'Adjust study time if your busy week flag is on — shorter blocks with more frequent breaks work better.';

const MOCK_CITATIONS: ChatCitation[] = [
  {
    id: createCitationId(),
    sourceType: 'local',
    fileName: 'Syllabus.pdf',
    excerpt:
      'Section 4.2: Exam covers chapters 3–5. Focus on problem sets 3.1–3.4 and the summary sheet.',
  },
  {
    id: createCitationId(),
    sourceType: 'local',
    fileName: 'Notes.md',
    excerpt: 'Definition: A study block should be 25–45 minutes with a 5-minute break for retention.',
  },
];

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

export async function streamMockAssistant(
  onChunk: (text: string) => void,
  signal: AbortSignal,
): Promise<{ content: string; citations: ChatCitation[]; sourceType: SourceType }> {
  const tokens = MOCK_RESPONSE.split(/(\s+)/).filter((t) => t.length > 0);
  let built = '';

  for (const token of tokens) {
    await delay(28 + Math.random() * 24, signal);
    built += token;
    onChunk(built);
  }

  return {
    content: built.trim(),
    citations: MOCK_CITATIONS,
    sourceType: 'local',
  };
}

/** Demo web-sourced reply (triggered by keyword "web" in user message for mock). */
export async function streamMockWebAssistant(
  onChunk: (text: string) => void,
  signal: AbortSignal,
): Promise<{ content: string; citations: ChatCitation[]; sourceType: SourceType }> {
  const text =
    'I searched the web for additional context. Here is a concise summary from public sources (mock data for Phase 6).';
  const tokens = text.split(/(\s+)/).filter((t) => t.length > 0);
  let built = '';
  for (const token of tokens) {
    await delay(35, signal);
    built += token;
    onChunk(built);
  }
  return {
    content: built.trim(),
    citations: [
      {
        id: createCitationId(),
        sourceType: 'web',
        fileName: 'example.com/article',
        excerpt: 'Public article excerpt used when local RAG has insufficient coverage.',
      },
    ],
    sourceType: 'web',
  };
}

export function shouldUseWebMock(userText: string): boolean {
  return /\b(web|internet|search online)\b/i.test(userText);
}
