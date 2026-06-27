import type { ResourceKind } from './resource-types';

/** Chunk stored in the local vector index (main process). */
export interface RagStoredChunk {
  id: string;
  /** @deprecated use resourceId */
  fileId: string;
  resourceId: string;
  fileName: string;
  text: string;
  chunkIndex: number;
  courseId?: string | null;
  resourceKind?: ResourceKind;
  noteId?: string;
  /** Sparse term-frequency vector for on-device similarity search. */
  embedding: Record<string, number>;
}

export interface RagIndexData {
  version: 1;
  chunks: RagStoredChunk[];
}

/** Result returned to renderer — no full file paths. */
export interface RelevantChunk {
  chunkId: string;
  /** @deprecated use resourceId */
  fileId: string;
  resourceId: string;
  fileName: string;
  text: string;
  score: number;
  courseId?: string | null;
}

export interface RagSearchOptions {
  topK?: number;
  courseId?: string | null;
}

export interface RagSearchResult {
  query: string;
  topK: number;
  chunks: RelevantChunk[];
}

export interface RagChunkPreview {
  chunkId: string;
  fileName: string;
  text: string;
}

/** Payload that would be sent to the gateway (Phase 9). Logged in dev only. */
export interface ChatOutboundPayload {
  message: string;
  relevant_chunks: Array<{
    chunkId: string;
    fileName: string;
    text: string;
  }>;
  recordedAt: string;
}
