import type { BrowserWindow } from 'electron';
import { randomUUID } from 'node:crypto';
import { IPC_CHANNELS } from '../../../shared/ipc-types';
import type { ChatCitation, SourceType } from '../../../shared/chat-types';
import type {
  ChatFeature,
  ChatSendResult,
  ChatStreamEvent,
  RequestErrorPayload,
} from '../../../shared/gateway-types';
import { IpcError, type IpcErrorCode } from '../../../shared/ipc-errors';
import { mapFetchError, streamChatViaGateway, toIpcError } from '../api/gateway-client';
import { readSettingsFile } from '../storage/file-store';
import { searchRag } from '../rag/search';
import { recordChatOutbound } from './outbound-log';

let getMainWindow: (() => BrowserWindow) | null = null;

const RETRYABLE: IpcErrorCode[] = [
  'GATEWAY_UNAVAILABLE',
  'GATEWAY_TIMEOUT',
  'GATEWAY_RATE_LIMIT',
  'GATEWAY_ERROR',
];

export function initChatService(getWindow: () => BrowserWindow): void {
  getMainWindow = getWindow;
}

function emitStream(event: ChatStreamEvent): void {
  const win = getMainWindow?.();
  if (!win || win.isDestroyed()) {
    return;
  }
  win.webContents.send(IPC_CHANNELS.CHAT_STREAM, event);
}

function toRequestError(error: unknown): RequestErrorPayload {
  if (error instanceof IpcError) {
    return {
      code: error.code as RequestErrorPayload['code'],
      message: error.message,
      retryable: RETRYABLE.includes(error.code),
    };
  }
  return mapFetchError(error);
}

function normalizeCitations(
  citations: ChatCitation[] | undefined,
  chunks: ChatSendResult['relevantChunks'],
): ChatCitation[] {
  if (citations) {
    return citations.map((c) => ({
      ...c,
      id: c.id || `cit_${randomUUID()}`,
      sourceType: (c.sourceType ?? 'local') as SourceType,
    }));
  }
  return chunks.map((chunk) => ({
    id: `cit_${randomUUID()}`,
    chunkId: chunk.chunkId,
    sourceType: 'local' as const,
    fileName: chunk.fileName,
    excerpt: chunk.text.slice(0, 320).trim() + (chunk.text.length > 320 ? '…' : ''),
  }));
}

export function runChatSend(
  requestId: string,
  message: string,
  sessionId?: string,
  courseId?: string | null,
  feature?: ChatFeature,
  locale?: string,
  history?: Array<{ role: 'user' | 'assistant'; content: string }>,
): Promise<void> {
  return (async () => {
    const settings = await readSettingsFile();
    const search = await searchRag(message, { topK: settings.ragTopK, courseId });
    const relevantChunks = search.chunks;

    recordChatOutbound(message, relevantChunks);

    let content = '';
    let thinking = '';
    const researchQueries: Array<{ query: string; snippet?: string }> = [];
    let sourceType: SourceType = 'local';
    let citations: ChatCitation[] = [];
    let pendingWebSave: ChatSendResult['pendingWebSave'];

    try {
      for await (const event of streamChatViaGateway({
        message,
        relevant_chunks: relevantChunks.map((c) => ({
          chunkId: c.chunkId,
          fileName: c.fileName,
          text: c.text,
        })),
        history,
        sessionId,
        course_id: courseId ?? null,
        locale: locale ?? settings.locale,
        feature: feature ?? 'chat',
      })) {
        if (event.type === 'delta' && event.delta) {
          content += event.delta;
          emitStream({ type: 'delta', requestId, delta: event.delta });
        } else if (event.type === 'thinking' && event.delta) {
          thinking += event.delta;
          emitStream({ type: 'thinking', requestId, delta: event.delta });
        } else if (event.type === 'research' && event.query) {
          researchQueries.push({ query: event.query, snippet: event.snippet });
          emitStream({
            type: 'research',
            requestId,
            query: event.query,
            snippet: event.snippet,
          });
        } else if (event.type === 'done') {
          content = event.content ?? content;
          sourceType = (event.sourceType ?? 'local') as SourceType;
          citations = normalizeCitations(event.citations, relevantChunks);
          pendingWebSave = event.pendingWebSave;
          if (event.thinking) {
            thinking = event.thinking;
          }
        } else if (event.type === 'usage') {
          emitStream({
            type: 'usage',
            requestId,
            daily_used: event.daily_used ?? 0,
            daily_remaining: event.daily_remaining ?? 0,
            daily_limit: event.daily_limit ?? 100,
          });
        } else if (event.type === 'error' && event.error) {
          throw toIpcError(event.error);
        }
      }

      emitStream({
        type: 'done',
        requestId,
        result: {
          content: content.trim(),
          sourceType,
          citations,
          pendingWebSave,
          relevantChunks,
          thinking: thinking.trim() || undefined,
          researchQueries: researchQueries.length ? researchQueries : undefined,
        },
      });
    } catch (error) {
      emitStream({ type: 'error', requestId, error: toRequestError(error) });
    }
  })();
}
