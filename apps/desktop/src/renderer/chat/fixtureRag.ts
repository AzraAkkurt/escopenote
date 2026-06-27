import type { RagSearchResult, RelevantChunk } from '@shared/rag-types';

const FIXTURE_CHUNKS: RelevantChunk[] = [
  {
    chunkId: 'chk_fixture_1',
    fileId: 'lib_fixture_1',
    resourceId: 'lib_fixture_1',
    fileName: 'Syllabus.pdf',
    text: 'Section 4.2: Exam covers chapters 3–5. Focus on problem sets 3.1–3.4 and the summary sheet.',
    score: 0.82,
  },
  {
    chunkId: 'chk_fixture_2',
    fileId: 'lib_fixture_2',
    resourceId: 'lib_fixture_2',
    fileName: 'Notes.md',
    text: 'Definition: A study block should be 25–45 minutes with a 5-minute break for retention.',
    score: 0.61,
  },
  {
    chunkId: 'chk_fixture_3',
    fileId: 'lib_fixture_seed',
    resourceId: 'lib_fixture_seed',
    fileName: 'study-guide.md',
    text: 'Exam covers chapters 3–5. Focus on problem sets 3.1–3.4 and the summary sheet.',
    score: 0.75,
  },
];

export function searchFixtureRag(query: string, topK: number): RagSearchResult {
  const terms = query.toLowerCase().split(/\W+/).filter((t) => t.length > 2);
  const scored = FIXTURE_CHUNKS.map((chunk) => {
    const hay = chunk.text.toLowerCase();
    let score = 0;
    for (const term of terms) {
      if (hay.includes(term)) {
        score += 1;
      }
    }
    return { ...chunk, score: score > 0 ? chunk.score * (1 + score * 0.2) : 0 };
  })
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  return { query, topK, chunks: scored };
}
