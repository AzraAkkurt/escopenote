export type SourceType = 'local' | 'web';

export interface RelevantChunkInput {
  chunkId: string;
  fileName: string;
  text: string;
}

export type ChatFeature = 'chat' | 'note_agent' | 'planner' | 'workflow';

export interface ChatHistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatStreamRequest {
  message: string;
  relevant_chunks?: RelevantChunkInput[];
  history?: ChatHistoryMessage[];
  session_id?: string;
  course_id?: string | null;
  locale?: string;
  feature?: ChatFeature;
}

export interface ChatCitation {
  id: string;
  chunkId?: string;
  sourceType: SourceType;
  fileName?: string;
  excerpt?: string;
}

export interface PendingWebSave {
  title: string;
  summary: string;
}

export interface ChatSseDeltaEvent {
  type: 'delta';
  delta: string;
}

export interface ChatSseThinkingEvent {
  type: 'thinking';
  delta: string;
}

export interface ChatSseResearchEvent {
  type: 'research';
  query: string;
  snippet?: string;
}

export interface ChatSseUsageEvent {
  type: 'usage';
  daily_used: number;
  daily_remaining: number;
  daily_limit: number;
}

export interface ChatSseDoneEvent {
  type: 'done';
  content: string;
  sourceType: SourceType;
  citations?: ChatCitation[];
  thinking?: string;
  pendingWebSave?: PendingWebSave;
}

export type ChatSseServerEvent =
  | ChatSseDeltaEvent
  | ChatSseThinkingEvent
  | ChatSseResearchEvent
  | ChatSseDoneEvent
  | ChatSseUsageEvent
  | import('./errors.js').SseErrorEvent;

export interface UsageResponse {
  daily_used: number;
  daily_remaining: number;
  daily_limit: number;
}
