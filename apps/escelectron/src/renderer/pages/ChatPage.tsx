import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@renderer/components/layout/PageHeader';
import { ChatLayout } from '@renderer/chat/components/ChatLayout';
import { Composer } from '@renderer/chat/components/Composer';
import { MessageList } from '@renderer/chat/components/MessageList';
import { RetrievalBanner } from '@renderer/chat/components/RetrievalBanner';
import { SaveWebResultModal } from '@renderer/chat/components/SaveWebResultModal';
import { SessionList } from '@renderer/chat/components/SessionList';
import { EMPTY_CHAT_STORE, normalizeChatStore } from '@renderer/chat/defaults';
import {
  appendMessage,
  createSession,
  newAssistantPlaceholder,
  newUserMessage,
  setActiveSession,
  upsertStore,
  updateMessage,
} from '@renderer/chat/session-mutations';
import { useFixturesMode } from '@renderer/config/env';
import { useLocalStore } from '@renderer/hooks/useLocalStore';
import { getRequestErrorMessage, isRetryableRequestError } from '@renderer/lib/request-error';
import { ipcCall } from '@renderer/lib/ipc';
import { useAppSettings } from '@renderer/providers/SettingsProvider';
import { useGateway } from '@renderer/providers/GatewayProvider';
import type { ChatSessionsStore } from '@shared/chat-types';
import type { ChatSendResult, PendingWebSave } from '@shared/gateway-types';
import { Button, Select, useToast } from '@renderer/components/ui';
import { useCourses } from '@renderer/courses/hooks/useCourses';
import '@renderer/styles/chat.css';

type RetrievalPhase = 'idle' | 'searching' | 'empty' | 'done';

export function ChatPage() {
  const { t: tp } = useTranslation('pages');
  const { t } = useTranslation('chat');
  const { t: tc } = useTranslation('common');
  const toast = useToast();
  const { settings } = useAppSettings();
  const { status: gatewayStatus } = useGateway();
  const fixtures = useFixturesMode();
  const { courses } = useCourses();
  const [courseFilterId, setCourseFilterId] = useState<string>('');
  const chatStore = useLocalStore<ChatSessionsStore>('chat.sessions');
  const store = useMemo(() => normalizeChatStore(chatStore.data), [chatStore.data]);
  const [generating, setGenerating] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [retrievalPhase, setRetrievalPhase] = useState<RetrievalPhase>('idle');
  const [pendingWebSave, setPendingWebSave] = useState<PendingWebSave | null>(null);
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const streamContentRef = useRef('');
  const streamThinkingRef = useRef('');
  const streamResearchRef = useRef<Array<{ query: string; snippet?: string }>>([]);

  const persist = (next: ChatSessionsStore) => {
    void chatStore.save(next);
  };

  const activeSession = store.sessions.find((s) => s.id === store.activeSessionId) ?? null;

  const updateSession = (session: NonNullable<typeof activeSession>) => {
    const current = normalizeChatStore(chatStore.data);
    persist(upsertStore(current, session));
  };

  const handleNewChat = useCallback(() => {
    const session = createSession();
    const next = setActiveSession(upsertStore(store, session), session.id);
    persist(next);
  }, [store, persist]);

  useEffect(() => {
    const onNewChat = () => handleNewChat();
    window.addEventListener('escopenote:new-chat', onNewChat);
    return () => window.removeEventListener('escopenote:new-chat', onNewChat);
  }, [handleNewChat]);

  const handleSelect = (id: string) => {
    persist(setActiveSession(store, id));
  };

  const handleRename = (id: string, title: string) => {
    const next = {
      ...store,
      sessions: store.sessions.map((s) =>
        s.id === id ? { ...s, title: title.trim() || s.title } : s,
      ),
    };
    persist(next);
  };

  const handleDelete = (id: string) => {
    const sessions = store.sessions.filter((s) => s.id !== id);
    const activeSessionId =
      store.activeSessionId === id ? (sessions[0]?.id ?? null) : store.activeSessionId;
    persist({ sessions, activeSessionId });
  };

  const handleStop = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setGenerating(false);
    setStreamingMessageId(null);
    setRetrievalPhase('idle');
  };

  const applyChatResult = (
    updated: NonNullable<typeof activeSession>,
    assistantMsgId: string,
    result: ChatSendResult,
  ) => {
    const next = updateMessage(updated, assistantMsgId, {
      content: result.content,
      citations: result.citations,
      sourceType: result.sourceType,
      thinking: result.thinking,
      researchQueries: result.researchQueries,
    });
    updateSession(next);

    if (result.relevantChunks.length === 0 && result.sourceType === 'web') {
      setRetrievalPhase('empty');
    } else {
      setRetrievalPhase('done');
    }

    if (result.pendingWebSave) {
      if (settings.confirmBeforeSavingWebResults) {
        setPendingWebSave(result.pendingWebSave);
      } else {
        void ipcCall((api) =>
          api.library.saveWebSummary(result.pendingWebSave!.title, result.pendingWebSave!.summary),
        ).then(() => toast.show(t('saveWebDone'), 'success'));
      }
    }
  };

  const runSend = async (text: string) => {
    let session = activeSession;
    if (!session) {
      session = createSession();
      persist(setActiveSession(upsertStore(store, session), session.id));
    }

    let updated = appendMessage(session, newUserMessage(text));
    const assistantMsg = newAssistantPlaceholder();
    updated = appendMessage(updated, assistantMsg);
    updateSession(updated);

    const requestId = crypto.randomUUID();
    const history = session.messages
      .filter((m) => m.content.trim())
      .slice(-12)
      .map((m) => ({
        role: m.role,
        content: m.content,
      }));

    const controller = new AbortController();
    abortRef.current = controller;
    setGenerating(true);
    setStreamingMessageId(assistantMsg.id);
    setRetrievalPhase('searching');
    setLastFailedMessage(null);
    streamContentRef.current = '';
    streamThinkingRef.current = '';
    streamResearchRef.current = [];

    const unsubscribe = window.escopenote.chat.onStream((event) => {
      if (event.requestId !== requestId || controller.signal.aborted) {
        return;
      }

      if (event.type === 'delta') {
        streamContentRef.current += event.delta;
        updated = updateMessage(updated, assistantMsg.id, {
          content: streamContentRef.current,
          thinking: streamThinkingRef.current || undefined,
          researchQueries: streamResearchRef.current.length
            ? [...streamResearchRef.current]
            : undefined,
        });
        updateSession(updated);
      } else if (event.type === 'thinking') {
        streamThinkingRef.current += event.delta;
        updated = updateMessage(updated, assistantMsg.id, {
          thinking: streamThinkingRef.current,
        });
        updateSession(updated);
      } else if (event.type === 'research') {
        streamResearchRef.current = [
          ...streamResearchRef.current,
          { query: event.query, snippet: event.snippet },
        ];
        updated = updateMessage(updated, assistantMsg.id, {
          researchQueries: [...streamResearchRef.current],
        });
        updateSession(updated);
      } else if (event.type === 'done') {
        applyChatResult(updated, assistantMsg.id, event.result);
      } else if (event.type === 'usage') {
        window.dispatchEvent(new CustomEvent('escopenote:usage-updated'));
        toast.show(
          t('usageRemaining', {
            remaining: event.daily_remaining,
            limit: event.daily_limit,
          }),
          'success',
        );
      } else if (event.type === 'error') {
        const err = event.error;
        toast.show(getRequestErrorMessage(err, tc), 'error');
        if (isRetryableRequestError(err)) {
          setLastFailedMessage(text);
        }
        updated = updateMessage(updated, assistantMsg.id, {
          content: t('chatError'),
        });
        updateSession(updated);
      }
    });

    try {
      await ipcCall((api) =>
        api.chat.send({
          requestId,
          message: text,
          sessionId: session!.id,
          courseId: courseFilterId || null,
          feature: 'chat',
          locale: settings.locale,
          history,
        }),
      );
    } catch (err) {
      toast.show(getRequestErrorMessage(err, tc), 'error');
      if (isRetryableRequestError(err)) {
        setLastFailedMessage(text);
      }
      updated = updateMessage(updated, assistantMsg.id, { content: t('chatError') });
      updateSession(updated);
    } finally {
      unsubscribe();
      setGenerating(false);
      setStreamingMessageId(null);
      abortRef.current = null;
      window.setTimeout(() => setRetrievalPhase('idle'), 5000);
    }
  };

  const handleSend = async (text: string) => {
    if (!fixtures && gatewayStatus === 'offline') {
      toast.show(t('gatewayOffline'), 'error');
      return;
    }

    await runSend(text);
  };

  const handleSaveWebAccept = () => {
    if (!pendingWebSave) {
      return;
    }
    const { title, summary } = pendingWebSave;
    setPendingWebSave(null);
    void ipcCall((api) => api.library.saveWebSummary(title, summary))
      .then(() => toast.show(t('saveWebDone'), 'success'))
      .catch((err) => toast.show(getRequestErrorMessage(err, tc), 'error'));
  };

  const handleSaveAsNote = async (message: { content: string }) => {
    try {
      const title = message.content.slice(0, 60).trim() || t('untitled');
      await ipcCall((api) =>
        api.notes.createFromChat(
          title,
          message.content,
          courseFilterId || null,
        ),
      );
      toast.show(t('saveAsNoteDone'), 'success');
    } catch (err) {
      toast.show(getRequestErrorMessage(err, tc), 'error');
    }
  };

  const courseOptions = [
    { value: '', label: t('courseAll') },
    ...courses.map((c) => ({ value: c.id, label: c.name })),
  ];

  const displayStore = store.sessions.length ? store : EMPTY_CHAT_STORE;
  const chatOffline = !fixtures && gatewayStatus === 'offline';

  return (
    <div className="page page--chat">
      <PageHeader title={tp('chat.title')} description={tp('chat.description')} />
      <div className="chat-toolbar">
        <Select
          label={t('courseFilter')}
          options={courseOptions}
          value={courseFilterId}
          onChange={(e) => setCourseFilterId(e.target.value)}
        />
      </div>
      <RetrievalBanner variant="privacy" />
      {chatOffline ? (
        <p className="chat-retrieval chat-retrieval--empty" role="status">
          {t('gatewayOfflineChat')}
        </p>
      ) : null}
      {retrievalPhase === 'searching' ? <RetrievalBanner variant="searching" /> : null}
      {retrievalPhase === 'empty' ? <RetrievalBanner variant="empty" /> : null}
      {lastFailedMessage ? (
        <div className="chat-retry">
          <Button variant="secondary" size="sm" onClick={() => void handleSend(lastFailedMessage)}>
            {t('retry')}
          </Button>
        </div>
      ) : null}
      <ChatLayout
        sidebar={
          <SessionList
            sessions={displayStore.sessions}
            activeId={store.activeSessionId}
            onSelect={handleSelect}
            onNew={handleNewChat}
            onRename={handleRename}
            onDelete={handleDelete}
          />
        }
      >
        <div className="chat-main">
          <MessageList
            messages={activeSession?.messages ?? []}
            streamingMessageId={streamingMessageId}
            onSaveAsNote={(msg) => void handleSaveAsNote(msg)}
          />
          <Composer
            disabled={chatStore.loading || chatOffline}
            generating={generating}
            onSend={(text) => void handleSend(text)}
            onStop={handleStop}
          />
        </div>
      </ChatLayout>
      <SaveWebResultModal
        pending={pendingWebSave}
        onAccept={handleSaveWebAccept}
        onDecline={() => setPendingWebSave(null)}
      />
    </div>
  );
}
