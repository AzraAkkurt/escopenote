import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { ChatMessage } from '@shared/chat-types';
import { useVirtualList } from '@renderer/hooks/useVirtualList';
import { MessageBubble } from './MessageBubble';

const ROW_HEIGHT = 88;
const VIRTUAL_THRESHOLD = 40;

interface MessageListProps {
  messages: ChatMessage[];
  streamingMessageId: string | null;
  onSaveAsNote?: (message: ChatMessage) => void;
}

export function MessageList({ messages, streamingMessageId, onSaveAsNote }: MessageListProps) {
  const { t } = useTranslation('chat');
  const containerRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const useVirtual = messages.length >= VIRTUAL_THRESHOLD;
  const { startIndex, endIndex, offsetTop, totalHeight } = useVirtualList(
    containerRef,
    messages.length,
    ROW_HEIGHT,
  );

  const visible = useVirtual ? messages.slice(startIndex, endIndex) : messages;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingMessageId]);

  const isStreaming = streamingMessageId !== null;

  return (
    <div
      ref={containerRef}
      className="message-list"
      role="log"
      aria-live="polite"
      aria-relevant="additions text"
      aria-busy={isStreaming}
      aria-label={t('messageListAria')}
    >
      {useVirtual ? (
        <div className="message-list__virtual-spacer" style={{ height: totalHeight }}>
          <div className="message-list__virtual-window" style={{ transform: `translateY(${offsetTop}px)` }}>
            {visible.map((msg) => (
              <div key={msg.id} className="message-list__row" style={{ minHeight: ROW_HEIGHT }}>
                <MessageBubble
                  message={msg}
                  isStreaming={msg.id === streamingMessageId}
                  onSaveAsNote={onSaveAsNote}
                />
              </div>
            ))}
          </div>
        </div>
      ) : (
        visible.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            isStreaming={msg.id === streamingMessageId}
            onSaveAsNote={onSaveAsNote}
          />
        ))
      )}
      {isStreaming ? (
        <p className="message-list__sr-status" role="status">
          {t('streaming')}
        </p>
      ) : null}
      <div ref={endRef} />
    </div>
  );
}
