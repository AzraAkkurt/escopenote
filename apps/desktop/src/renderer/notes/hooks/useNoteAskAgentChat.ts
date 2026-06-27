import { useCallback, useRef, useState } from 'react';
import { ipcCall } from '@renderer/lib/ipc';
import type { ChatSendResult } from '@shared/gateway-types';

export interface NoteAgentMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  thinking?: string;
  researchQueries?: Array<{ query: string; snippet?: string }>;
  streaming?: boolean;
  error?: boolean;
}

function newMessageId(): string {
  return `na_${crypto.randomUUID().slice(0, 12)}`;
}

export function useNoteAskAgentChat(courseId: string | null) {
  const [messages, setMessages] = useState<NoteAgentMessage[]>([]);
  const [generating, setGenerating] = useState(false);
  const generatingRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  generatingRef.current = generating;

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setGenerating(false);
    setMessages((prev) =>
      prev.map((m) => (m.streaming ? { ...m, streaming: false } : m)),
    );
  }, []);

  const clear = useCallback(() => {
    stop();
    setMessages([]);
  }, [stop]);

  const send = useCallback(
    async (
      payload: string,
      options: {
        locale?: string;
        formatError: (error: unknown) => string;
        onErrorToast?: (message: string) => void;
        onDone?: (result: ChatSendResult) => void;
      },
    ) => {
      const trimmed = payload.trim();
      if (!trimmed || generatingRef.current) {
        return;
      }

      const userMsg: NoteAgentMessage = {
        id: newMessageId(),
        role: 'user',
        content: trimmed,
      };
      const assistantId = newMessageId();
      const assistantPlaceholder: NoteAgentMessage = {
        id: assistantId,
        role: 'assistant',
        content: '',
        streaming: true,
      };

      setMessages((prev) => [...prev, userMsg, assistantPlaceholder]);

      const requestId = crypto.randomUUID();
      const controller = new AbortController();
      abortRef.current = controller;
      setGenerating(true);

      let content = '';
      let thinking = '';
      const researchQueries: Array<{ query: string; snippet?: string }> = [];

      const patchAssistant = (patch: Partial<NoteAgentMessage>) => {
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, ...patch } : m)),
        );
      };

      const unsubscribe = window.escopenote.chat.onStream((event) => {
        if (event.requestId !== requestId || controller.signal.aborted) {
          return;
        }

        if (event.type === 'delta') {
          content += event.delta;
          patchAssistant({
            content,
            thinking: thinking || undefined,
            researchQueries: researchQueries.length ? [...researchQueries] : undefined,
          });
        } else if (event.type === 'thinking') {
          thinking += event.delta;
          patchAssistant({ thinking: thinking || undefined });
        } else if (event.type === 'research') {
          researchQueries.push({ query: event.query, snippet: event.snippet });
          patchAssistant({ researchQueries: [...researchQueries] });
        } else if (event.type === 'done') {
          content = event.result.content;
          patchAssistant({
            content,
            thinking: event.result.thinking,
            researchQueries: event.result.researchQueries,
            streaming: false,
          });
          options.onDone?.(event.result);
        } else if (event.type === 'error') {
          const msg = options.formatError(event.error);
          patchAssistant({
            content: msg,
            streaming: false,
            error: true,
          });
          options.onErrorToast?.(msg);
        }
      });

      try {
        await ipcCall((api) =>
          api.chat.send({
            requestId,
            message: trimmed,
            courseId,
            feature: 'note_agent',
            locale: options.locale,
          }),
        );
      } catch (err) {
        const msg = options.formatError(err);
        patchAssistant({
          content: msg,
          streaming: false,
          error: true,
        });
        options.onErrorToast?.(msg);
      } finally {
        unsubscribe();
        abortRef.current = null;
        setGenerating(false);
      }
    },
    [courseId],
  );

  return { messages, generating, send, stop, clear };
}
