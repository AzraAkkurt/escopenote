import type { ChatSessionsStore } from '@shared/chat-types';

export const EMPTY_CHAT_STORE: ChatSessionsStore = {
  sessions: [],
  activeSessionId: null,
};

export function createSessionId(): string {
  return `chat_${crypto.randomUUID().slice(0, 8)}`;
}

export function createMessageId(): string {
  return `msg_${crypto.randomUUID().slice(0, 8)}`;
}

export function createCitationId(): string {
  return `cite_${crypto.randomUUID().slice(0, 8)}`;
}

export function normalizeChatStore(store: ChatSessionsStore | null): ChatSessionsStore {
  if (!store?.sessions) {
    return { ...EMPTY_CHAT_STORE };
  }
  return {
    sessions: store.sessions,
    activeSessionId: store.activeSessionId,
  };
}
