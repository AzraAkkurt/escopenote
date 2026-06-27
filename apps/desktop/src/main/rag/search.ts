import { readSettingsFile } from '../storage/file-store';
import type { RagSearchOptions, RagSearchResult, RelevantChunk } from '../../../shared/rag-types';
import { cosineSimilarity, embedText } from './embedder';
import { listChunks } from './vector-store';

export async function searchRag(
  query: string,
  topKOrOptions?: number | RagSearchOptions,
): Promise<RagSearchResult> {
  const settings = await readSettingsFile();
  let topK = settings.ragTopK ?? 5;
  let courseId: string | null | undefined;

  if (typeof topKOrOptions === 'number') {
    topK = topKOrOptions;
  } else if (topKOrOptions) {
    topK = topKOrOptions.topK ?? topK;
    courseId = topKOrOptions.courseId;
  }

  const queryVector = embedText(query);
  let chunks = await listChunks();

  if (courseId !== undefined && courseId !== null) {
    chunks = chunks.filter((c) => c.courseId === courseId);
  }

  const scored: RelevantChunk[] = chunks
    .map((chunk) => ({
      chunkId: chunk.id,
      fileId: chunk.fileId,
      resourceId: chunk.resourceId ?? chunk.fileId,
      fileName: chunk.fileName,
      text: chunk.text,
      score: cosineSimilarity(queryVector, chunk.embedding),
      courseId: chunk.courseId,
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  return { query, topK, chunks: scored };
}
