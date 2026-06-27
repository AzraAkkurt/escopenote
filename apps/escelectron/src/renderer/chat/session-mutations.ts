import type { ChatMessage, ChatSession, ChatSessionsStore } from '@shared/chat-types';
import { createMessageId, createSessionId } from './defaults';

export function createSession(title?: string): ChatSession {
  const now = new Date().toISOString();
  return {
    id: createSessionId(),
    title: title ?? 'New chat',
    createdAt: now,
    updatedAt: now,
    messages: [],
  };
}

export function upsertStore(store: ChatSessionsStore, session: ChatSession): ChatSessionsStore {
  const exists = store.sessions.some((s) => s.id === session.id);
  const sessions = exists
    ? store.sessions.map((s) => (s.id === session.id ? session : s))
    : [...store.sessions, session];
  return { ...store, sessions };
}

export function setActiveSession(store: ChatSessionsStore, sessionId: string): ChatSessionsStore {
  return { ...store, activeSessionId: sessionId };
}

export function deleteSession(store: ChatSessionsStore, sessionId: string): ChatSessionsStore {
  const sessions = store.sessions.filter((s) => s.id !== sessionId);
  const activeSessionId =
    store.activeSessionId === sessionId ? (sessions[0]?.id ?? null) : store.activeSessionId;
  return { sessions, activeSessionId };
}

export function renameSession(
  store: ChatSessionsStore,
  sessionId: string,
  title: string,
): ChatSessionsStore {
  return {
    ...store,
    sessions: store.sessions.map((s) =>
      s.id === sessionId ? { ...s, title: title.trim() || s.title, updatedAt: new Date().toISOString() } : s,
    ),
  };
}

export function appendMessage(session: ChatSession, message: ChatMessage): ChatSession {
  return {
    ...session,
    messages: [...session.messages, message],
    updatedAt: new Date().toISOString(),
    title:
      session.messages.length === 0 && message.role === 'user'
        ? message.content.slice(0, 40) || session.title
        : session.title,
  };
}

export function updateMessage(
  session: ChatSession,
  messageId: string,
  patch: Partial<ChatMessage>,
): ChatSession {
  return {
    ...session,
    messages: session.messages.map((m) => (m.id === messageId ? { ...m, ...patch } : m)),
    updatedAt: new Date().toISOString(),
  };
}

export function newUserMessage(content: string): ChatMessage {
  return {
    id: createMessageId(),
    role: 'user',
    content,
    createdAt: new Date().toISOString(),
  };
}

export function newAssistantPlaceholder(): ChatMessage {
  return {
    id: createMessageId(),
    role: 'assistant',
    content: '',
    createdAt: new Date().toISOString(),
  };
}
