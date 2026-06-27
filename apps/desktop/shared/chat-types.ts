export type SourceType = 'local' | 'web';

export type ChatRole = 'user' | 'assistant';

export interface ChatCitation {
  id: string;
  /** Local RAG chunk id when grounded in the knowledge library. */
  chunkId?: string;
  sourceType: SourceType;
  fileName: string;
  excerpt: string;
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
  citations?: ChatCitation[];
  /** Primary source for assistant replies when not per-citation */
  sourceType?: SourceType;
  thinking?: string;
  researchQueries?: Array<{ query: string; snippet?: string }>;
  courseId?: string | null;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
}

export interface ChatSessionsStore {
  sessions: ChatSession[];
  activeSessionId: string | null;
}
