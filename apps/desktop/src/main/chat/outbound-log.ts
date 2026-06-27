import type { ChatOutboundPayload } from '../../../shared/rag-types';
import type { RelevantChunk } from '../../../shared/rag-types';

let lastOutbound: ChatOutboundPayload | null = null;

export function recordChatOutbound(message: string, chunks: RelevantChunk[]): ChatOutboundPayload {
  const payload: ChatOutboundPayload = {
    message,
    relevant_chunks: chunks.map((c) => ({
      chunkId: c.chunkId,
      fileName: c.fileName,
      text: c.text,
    })),
    recordedAt: new Date().toISOString(),
  };

  lastOutbound = payload;

  if (process.env.NODE_ENV === 'development') {
    console.info('[escopenote] chat outbound preview (dev)', JSON.stringify(payload, null, 2));
  }

  return payload;
}

export function getLastChatOutbound(): ChatOutboundPayload | null {
  return lastOutbound;
}
