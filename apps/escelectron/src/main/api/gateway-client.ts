import { randomUUID } from 'node:crypto';
import { IpcError } from '../../../shared/ipc-errors';
import type { ChatCitation } from '../../../shared/chat-types';
import type {
  ChatGatewayBody,
  GatewayHealthResult,
  PendingWebSave,
  RequestErrorPayload,
} from '../../../shared/gateway-types';
import { readSettingsFile } from '../storage/file-store';
import { getClientId } from '../usage/client-id-store.js';

const DEFAULT_TIMEOUT_MS = 30_000;
const HEALTH_TIMEOUT_MS = 5_000;

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, '');
}

function parseErrorBody(bodyText: string): { code?: string; message?: string } | null {
  try {
    const parsed = JSON.parse(bodyText) as { error?: { code?: string; message?: string } };
    return parsed.error ?? null;
  } catch {
    return null;
  }
}

export function normalizeStreamError(error: {
  code?: string;
  message?: string;
  retryable?: boolean;
}): RequestErrorPayload {
  const message = error.message ?? '';
  if (
    error.code === 'PROVIDER_UNAVAILABLE' ||
    message.includes('API key not valid') ||
    message.includes('API_KEY_INVALID') ||
    message.includes('Gemini API key')
  ) {
    return {
      code: 'GATEWAY_ERROR',
      message:
        'Yapay zeka sunucusunda Gemini API anahtarı geçersiz. Sunucu yöneticisinin GEMINI_API_KEY ayarını güncellemesi gerekir.',
      retryable: false,
    };
  }
  if (error.code === 'VALIDATION_ERROR') {
    return {
      code: 'GATEWAY_ERROR',
      message: 'İstek reddedildi. Lütfen mesajınızı kontrol edip tekrar deneyin.',
      retryable: false,
    };
  }
  return {
    code: 'GATEWAY_ERROR',
    message: message.slice(0, 200) || 'Gateway returned an error',
    retryable: error.retryable ?? false,
  };
}

export function mapHttpError(status: number, bodyText: string): RequestErrorPayload {
  if (status === 400) {
    const apiError = parseErrorBody(bodyText);
    if (apiError?.code === 'VALIDATION_ERROR') {
      return {
        code: 'GATEWAY_ERROR',
        message: 'İstek reddedildi. Lütfen mesajınızı kontrol edip tekrar deneyin.',
        retryable: false,
      };
    }
  }
  if (status === 401 || status === 403) {
    return {
      code: 'GATEWAY_UNAUTHORIZED',
      message:
        'İstemci kimliği geçersiz. Uygulamayı yeniden başlatın veya ağ geçidi URL’sini kontrol edin.',
      retryable: false,
    };
  }
  if (status === 429) {
    return {
      code: 'GATEWAY_RATE_LIMIT',
      message: 'Günlük 100 kullanım hakkınız doldu. Yarın tekrar deneyin.',
      retryable: false,
    };
  }
  if (status >= 500) {
    return {
      code: 'GATEWAY_ERROR',
      message: 'The AI gateway is temporarily unavailable.',
      retryable: true,
    };
  }
  const detail = bodyText.slice(0, 200);
  return {
    code: 'GATEWAY_ERROR',
    message: detail || `Gateway returned error ${status}`,
    retryable: status >= 500,
  };
}

export function mapFetchError(error: unknown): RequestErrorPayload {
  if (error instanceof IpcError) {
    const retryable = ['GATEWAY_UNAVAILABLE', 'GATEWAY_TIMEOUT', 'GATEWAY_RATE_LIMIT', 'GATEWAY_ERROR'].includes(
      error.code,
    );
    return {
      code: error.code as RequestErrorPayload['code'],
      message: error.message,
      retryable,
    };
  }
  const message = error instanceof Error ? error.message : 'Network error';
  if (message.includes('abort') || message.includes('timeout')) {
    return {
      code: 'GATEWAY_TIMEOUT',
      message: 'The gateway did not respond in time.',
      retryable: true,
    };
  }
  return {
    code: 'GATEWAY_UNAVAILABLE',
    message: 'Cannot reach the AI gateway. Check the URL and that the server is running.',
    retryable: true,
  };
}

export function toIpcError(payload: RequestErrorPayload): IpcError {
  return new IpcError(payload.code, payload.message);
}

async function gatewayFetch(
  path: string,
  init: RequestInit & { timeoutMs?: number } = {},
): Promise<Response> {
  const settings = await readSettingsFile();
  const base = normalizeBaseUrl(settings.gatewayUrl);
  const { timeoutMs: requestTimeout, ...rest } = init;
  const timeoutMs = requestTimeout ?? DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const clientId = await getClientId();

  try {
    return await fetch(`${base}${path}`, {
      ...rest,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-Client-Id': clientId,
        ...(rest.headers as Record<string, string> | undefined),
      },
    });
  } finally {
    clearTimeout(timer);
  }
}

export async function testGatewayConnection(): Promise<GatewayHealthResult> {
  const started = Date.now();
  try {
    const res = await gatewayFetch('/health', {
      method: 'GET',
      timeoutMs: HEALTH_TIMEOUT_MS,
    });
    const latencyMs = Date.now() - started;
    if (!res.ok) {
      const text = await res.text();
      throw toIpcError(mapHttpError(res.status, text));
    }
    const body = (await res.json()) as {
      ok?: boolean;
      version?: string;
      provider?: 'gemini' | 'mock';
      capabilities?: string[];
    };
    return {
      ok: body.ok ?? true,
      latencyMs,
      version: body.version,
      provider: body.provider,
      capabilities: body.capabilities,
    };
  } catch (error) {
    if (error instanceof IpcError) {
      throw error;
    }
    throw toIpcError(mapFetchError(error));
  }
}

export interface ChatSseEvent {
  type: 'delta' | 'thinking' | 'research' | 'usage' | 'done' | 'error';
  daily_used?: number;
  daily_remaining?: number;
  daily_limit?: number;
  delta?: string;
  query?: string;
  snippet?: string;
  content?: string;
  sourceType?: 'local' | 'web';
  citations?: ChatCitation[];
  pendingWebSave?: PendingWebSave;
  thinking?: string;
  error?: RequestErrorPayload;
}

export async function* streamChatViaGateway(
  body: ChatGatewayBody,
): AsyncGenerator<ChatSseEvent> {
  const settings = await readSettingsFile();
  const base = normalizeBaseUrl(settings.gatewayUrl);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  const clientId = await getClientId();
  const requestId = randomUUID();
  let res: Response;
  try {
    res = await fetch(`${base}/v1/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
        'X-Request-Id': requestId,
        'X-Client-Id': clientId,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (error) {
    clearTimeout(timer);
    yield { type: 'error', error: mapFetchError(error) };
    return;
  }

  if (!res.ok) {
    clearTimeout(timer);
    const text = await res.text();
    yield { type: 'error', error: mapHttpError(res.status, text) };
    return;
  }

  const reader = res.body?.getReader();
  if (!reader) {
    clearTimeout(timer);
    yield { type: 'error', error: mapHttpError(500, 'No response body') };
    return;
  }

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split('\n\n');
      buffer = parts.pop() ?? '';

      for (const part of parts) {
        const line = part
          .split('\n')
          .find((l) => l.startsWith('data:'));
        if (!line) {
          continue;
        }
        const json = line.slice(5).trim();
        if (!json) {
          continue;
        }
        try {
          const event = JSON.parse(json) as ChatSseEvent;
          if (event.type === 'error' && event.error) {
            yield { type: 'error', error: normalizeStreamError(event.error) };
            continue;
          }
          yield event;
        } catch {
          // skip malformed SSE frames
        }
      }
    }
  } finally {
    clearTimeout(timer);
    reader.releaseLock();
  }
}
