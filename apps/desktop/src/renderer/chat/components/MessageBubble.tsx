import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge, Button } from '@renderer/components/ui';
import type { ChatMessage } from '@shared/chat-types';
import { CitationChip } from './CitationChip';
import { StreamingIndicator } from './StreamingIndicator';
import { ChatMarkdown } from '@renderer/lib/chat-markdown';

interface MessageBubbleProps {
  message: ChatMessage;
  isStreaming?: boolean;
  onSaveAsNote?: (message: ChatMessage) => void;
}

export function MessageBubble({ message, isStreaming, onSaveAsNote }: MessageBubbleProps) {
  const { t } = useTranslation('chat');
  const [copied, setCopied] = useState(false);
  const [thinkingOpen, setThinkingOpen] = useState(false);
  const [researchOpen, setResearchOpen] = useState(false);

  const isUser = message.role === 'user';
  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const copyContent = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <article
      className={`message-bubble message-bubble--${message.role}${isStreaming ? ' message-bubble--streaming' : ''}`}
    >
      <div className="message-bubble__meta">
        <span className="message-bubble__role">
          {isUser ? t('roleUser') : t('roleAssistant')}
        </span>
        <time className="message-bubble__time" dateTime={message.createdAt}>
          {time}
        </time>
        {!isUser && message.content ? (
          <>
            <Button variant="ghost" size="sm" onClick={() => void copyContent()}>
              {copied ? t('copied') : t('copy')}
            </Button>
            {onSaveAsNote ? (
              <Button variant="ghost" size="sm" onClick={() => onSaveAsNote(message)}>
                {t('saveAsNote')}
              </Button>
            ) : null}
          </>
        ) : null}
      </div>

      {!isUser && message.thinking ? (
        <details
          className="message-bubble__panel message-bubble__panel--thinking"
          open={thinkingOpen}
          onToggle={(e) => setThinkingOpen((e.target as HTMLDetailsElement).open)}
        >
          <summary>{t('thinkingTitle')}</summary>
          <pre className="message-bubble__panel-body">{message.thinking}</pre>
        </details>
      ) : null}

      {!isUser && message.researchQueries?.length ? (
        <details
          className="message-bubble__panel message-bubble__panel--research"
          open={researchOpen}
          onToggle={(e) => setResearchOpen((e.target as HTMLDetailsElement).open)}
        >
          <summary>{t('researchTitle', { count: message.researchQueries.length })}</summary>
          <ul className="message-bubble__research-list">
            {message.researchQueries.map((item, index) => (
              <li key={`${item.query}-${index}`}>
                <strong>{item.query}</strong>
                {item.snippet ? <p>{item.snippet}</p> : null}
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      {isStreaming && !message.content ? <StreamingIndicator /> : null}

      {message.content ? (
        <div className="message-bubble__content">
          <ChatMarkdown content={message.content} />
          {isStreaming ? <span className="message-bubble__cursor">▍</span> : null}
        </div>
      ) : null}

      {!isUser && message.sourceType ? (
        <Badge
          variant={message.sourceType === 'web' ? 'default' : 'accent'}
          className={`message-bubble__source message-bubble__source--${message.sourceType}`}
        >
          {message.sourceType === 'web' ? t('sourceWeb') : t('sourceLocal')}
        </Badge>
      ) : null}

      {!isUser && message.citations?.length ? (
        <div className="message-bubble__citations">
          {message.citations.map((c) => (
            <CitationChip key={c.id} citation={c} />
          ))}
        </div>
      ) : null}
    </article>
  );
}
