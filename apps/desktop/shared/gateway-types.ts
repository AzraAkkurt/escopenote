import type { ChatCitation, SourceType } from './chat-types';
import type { RelevantChunk } from './rag-types';

export type RequestErrorCode =
  | 'GATEWAY_UNAVAILABLE'
  | 'GATEWAY_UNAUTHORIZED'
  | 'GATEWAY_RATE_LIMIT'
  | 'GATEWAY_TIMEOUT'
  | 'GATEWAY_ERROR';

export interface RequestErrorPayload {
  code: RequestErrorCode;
  message: string;
  retryable: boolean;
}

export type GatewayProvider = 'gemini' | 'mock';

export interface GatewayHealthResult {
  ok: boolean;
  latencyMs: number;
  version?: string;
  provider?: GatewayProvider;
  capabilities?: string[];
}

export type ChatFeature = 'chat' | 'note_agent' | 'planner' | 'workflow';

export interface ChatSendRequest {
  requestId: string;
  message: string;
  sessionId?: string;
  courseId?: string | null;
  feature?: ChatFeature;
  locale?: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export interface ChatGatewayChunk {
  chunkId: string;
  fileName: string;
  text: string;
}

export interface ChatGatewayBody {
  message: string;
  relevant_chunks: ChatGatewayChunk[];
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  sessionId?: string;
  session_id?: string;
  course_id?: string | null;
  locale?: string;
  feature?: ChatFeature;
}

export interface PendingWebSave {
  title: string;
  summary: string;
}

export interface ChatSendResult {
  content: string;
  sourceType: SourceType;
  citations: ChatCitation[];
  pendingWebSave?: PendingWebSave;
  relevantChunks: RelevantChunk[];
  thinking?: string;
  researchQueries?: Array<{ query: string; snippet?: string }>;
}

export interface UsageQuotaInfo {
  daily_used: number;
  daily_remaining: number;
  daily_limit: number;
}

export type ChatStreamEvent =
  | { type: 'delta'; requestId: string; delta: string }
  | { type: 'thinking'; requestId: string; delta: string }
  | { type: 'research'; requestId: string; query: string; snippet?: string }
  | {
      type: 'usage';
      requestId: string;
      daily_used: number;
      daily_remaining: number;
      daily_limit: number;
    }
  | { type: 'done'; requestId: string; result: ChatSendResult }
  | { type: 'error'; requestId: string; error: RequestErrorPayload };
