import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Editor, Range } from '@tiptap/core';
import { useTranslation } from 'react-i18next';
import { Button, Modal, useToast } from '@renderer/components/ui';
import { ChatMarkdown } from '@renderer/lib/chat-markdown';
import { useFixturesMode } from '@renderer/config/env';
import { getRequestErrorMessage } from '@renderer/lib/request-error';
import {
  useNoteAskAgentChat,
  type NoteAgentMessage,
} from '@renderer/notes/hooks/useNoteAskAgentChat';
import { buildNoteAgentMessage } from '@renderer/notes/utils/build-note-agent-message';
import { insertAgentResponseIntoNote } from '@renderer/notes/utils/insert-agent-response';
import { useAppSettings } from '@renderer/providers/SettingsProvider';
import { useGateway } from '@renderer/providers/GatewayProvider';

export interface NoteAskAgentContext {
  noteId: string;
  noteTitle: string;
  courseId: string | null;
  getNoteMarkdown: () => string;
}

interface NoteAskAgentModalProps {
  open: boolean;
  context: NoteAskAgentContext | null;
  editor: Editor | null;
  insertRange?: Range;
  onClose: () => void;
}

function AgentMessageRow({
  message,
  onCopy,
  onInsert,
  canInsert,
  labels,
}: {
  message: NoteAgentMessage;
  onCopy: (text: string) => void;
  onInsert: (text: string) => void;
  canInsert: boolean;
  labels: {
    copy: string;
    insert: string;
    copied: string;
    researchTitle: string;
    thinkingTitle: string;
    you: string;
    agent: string;
  };
}) {
  const isUser = message.role === 'user';
  const hasContent = Boolean(message.content.trim());

  return (
    <article
      className={`note-ask-agent__msg note-ask-agent__msg--${message.role}${
        message.error ? ' note-ask-agent__msg--error' : ''
      }`}
    >
      <header className="note-ask-agent__msg-head">
        <span className="note-ask-agent__msg-role">{isUser ? labels.you : labels.agent}</span>
        {!isUser && hasContent && !message.streaming ? (
          <span className="note-ask-agent__msg-actions">
            <Button variant="ghost" size="sm" onClick={() => onCopy(message.content)}>
              {labels.copy}
            </Button>
            {canInsert ? (
              <Button variant="ghost" size="sm" onClick={() => onInsert(message.content)}>
                {labels.insert}
              </Button>
            ) : null}
          </span>
        ) : null}
      </header>

      {!isUser && message.thinking ? (
        <details className="note-ask-agent__panel">
          <summary>{labels.thinkingTitle}</summary>
          <pre className="note-ask-agent__panel-body">{message.thinking}</pre>
        </details>
      ) : null}

      {!isUser && message.researchQueries?.length ? (
        <details className="note-ask-agent__panel note-ask-agent__panel--research">
          <summary>
            {labels.researchTitle}
          </summary>
          <ul className="note-ask-agent__research-list">
            {message.researchQueries.map((item, index) => (
              <li key={`${item.query}-${index}`}>
                <strong>{item.query}</strong>
                {item.snippet ? <p>{item.snippet}</p> : null}
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      <div className="note-ask-agent__msg-body">
        {message.streaming && !message.content ? (
          <span className="note-ask-agent__typing" aria-hidden>
            …
          </span>
        ) : (
          <ChatMarkdown content={message.content} />
        )}
      </div>
    </article>
  );
}

export function NoteAskAgentModal({
  open,
  context,
  editor,
  insertRange,
  onClose,
}: NoteAskAgentModalProps) {
  const { t } = useTranslation('notes');
  const { t: tc } = useTranslation('common');
  const toast = useToast();
  const fixtures = useFixturesMode();
  const { settings } = useAppSettings();
  const { status: gatewayStatus } = useGateway();
  const [draft, setDraft] = useState('');
  const [includeNote, setIncludeNote] = useState(true);
  const [preferWeb, setPreferWeb] = useState(false);
  const [contextOpen, setContextOpen] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const courseId = context?.courseId ?? null;
  const { messages, generating, send, stop, clear } = useNoteAskAgentChat(courseId);

  useEffect(() => {
    if (!open) {
      return;
    }
    setDraft('');
    setIncludeNote(true);
    setPreferWeb(false);
    setContextOpen(false);
    clear();
  }, [open, context?.noteId, clear]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) {
      return;
    }
    el.scrollTop = el.scrollHeight;
  }, [messages, generating]);

  const messageLabels = useMemo(
    () => ({
      preamble: t('askAgent.messagePreamble'),
      webHint: t('askAgent.messageWebHint'),
      noteTitleLabel: t('askAgent.messageNoteTitle'),
      noteBodyLabel: t('askAgent.messageNoteBody'),
      emptyNote: t('askAgent.emptyNote'),
      questionLabel: t('askAgent.messageQuestion'),
    }),
    [t],
  );

  const buildPayload = useCallback(
    (question: string) => {
      if (!context) {
        return question;
      }
      return buildNoteAgentMessage({
        userQuestion: question,
        noteTitle: context.noteTitle,
        noteMarkdown: context.getNoteMarkdown(),
        includeNoteContext: includeNote,
        preferWebSearch: preferWeb,
        labels: messageLabels,
      });
    },
    [context, includeNote, preferWeb, messageLabels],
  );

  const handleSend = async () => {
    const question = draft.trim();
    if (!question) {
      return;
    }
    if (!fixtures && gatewayStatus === 'offline') {
      toast.show(t('askAgent.gatewayOffline'), 'error');
      return;
    }

    const payload = buildPayload(question);
    setDraft('');
    await send(payload, {
      locale: settings.locale,
      formatError: (err) => getRequestErrorMessage(err, tc),
      onErrorToast: (msg) => toast.show(msg, 'error'),
    });
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.show(t('askAgent.copied'), 'success');
    } catch {
      toast.show(t('askAgent.copyFailed'), 'error');
    }
  };

  const handleInsert = (text: string) => {
    if (!editor) {
      return;
    }
    insertAgentResponseIntoNote(editor, text, insertRange);
    toast.show(t('askAgent.inserted'), 'success');
    onClose();
  };

  const liveMarkdown = context?.getNoteMarkdown() ?? '';
  const contextPreview = liveMarkdown.trim().slice(0, 600);

  return (
    <Modal isOpen={open} title={t('askAgent.title')} onClose={onClose} size="large">
      <div className="note-ask-agent">
        <p className="note-ask-agent__intro">{t('askAgent.intro')}</p>

        {context ? (
          <details
            className="note-ask-agent__context"
            open={contextOpen}
            onToggle={(e) => setContextOpen((e.target as HTMLDetailsElement).open)}
          >
            <summary>{t('askAgent.contextPreview', { title: context.noteTitle || t('untitled') })}</summary>
            <pre className="note-ask-agent__context-body">
              {contextPreview || t('askAgent.emptyNote')}
              {liveMarkdown.length > 600 ? '…' : ''}
            </pre>
          </details>
        ) : null}

        <div className="note-ask-agent__options" role="group" aria-label={t('askAgent.optionsAria')}>
          <label className="note-ask-agent__option">
            <input
              type="checkbox"
              checked={includeNote}
              onChange={(e) => setIncludeNote(e.target.checked)}
            />
            <span>{t('askAgent.includeNote')}</span>
          </label>
          <label className="note-ask-agent__option">
            <input
              type="checkbox"
              checked={preferWeb}
              onChange={(e) => setPreferWeb(e.target.checked)}
            />
            <span>{t('askAgent.preferWeb')}</span>
          </label>
        </div>

        <div ref={listRef} className="note-ask-agent__messages" aria-live="polite">
          {messages.length === 0 ? (
            <p className="note-ask-agent__empty">{t('askAgent.emptyChat')}</p>
          ) : (
            messages.map((msg) => (
              <AgentMessageRow
                key={msg.id}
                message={msg}
                canInsert={Boolean(editor) && msg.role === 'assistant'}
                labels={{
                  copy: t('askAgent.copy'),
                  insert: t('askAgent.insertIntoNote'),
                  copied: t('askAgent.copied'),
                  researchTitle: t('askAgent.researchTitle', {
                    count: msg.researchQueries?.length ?? 0,
                  }),
                  thinkingTitle: t('askAgent.thinkingTitle'),
                  you: t('askAgent.you'),
                  agent: t('askAgent.agent'),
                }}
                onCopy={handleCopy}
                onInsert={handleInsert}
              />
            ))
          )}
        </div>

        <div className="note-ask-agent__composer">
          <textarea
            className="note-ask-agent__input"
            rows={3}
            value={draft}
            placeholder={t('askAgent.placeholder')}
            disabled={generating}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void handleSend();
              }
            }}
          />
          <div className="note-ask-agent__composer-actions">
            {generating ? (
              <Button variant="danger" onClick={stop}>
                {t('askAgent.stop')}
              </Button>
            ) : (
              <Button variant="primary" onClick={() => void handleSend()} disabled={!draft.trim()}>
                {t('askAgent.send')}
              </Button>
            )}
            <Button variant="ghost" onClick={onClose}>
              {t('askAgent.close')}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
