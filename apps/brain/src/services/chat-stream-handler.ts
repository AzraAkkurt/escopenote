import { randomUUID } from 'node:crypto';
import type { ServerResponse } from 'node:http';
import type { ChatStreamRequest } from '@escopenote/contracts';
import { hasGemini } from '../config.js';
import { streamChatGemini } from './gemini-chat.js';
import { streamChatMock } from './chat-mock.js';
import { endSse, writeSse } from '../sse.js';

export async function handleChatStream(
  body: ChatStreamRequest,
  res: ServerResponse,
  options: {
    requestId?: string;
    usageAfterReserve?: { used: number; limit: number; remaining: number };
  },
): Promise<void> {
  const requestId = options.requestId?.trim() || randomUUID();

  try {
    if (hasGemini()) {
      await streamChatGemini(body, res, { leaveOpen: Boolean(options.usageAfterReserve) });
    } else {
      await streamChatMock(body, res, { leaveOpen: Boolean(options.usageAfterReserve) });
    }
  } catch {
    return;
  }

  if (options.usageAfterReserve) {
    writeSse(res, {
      type: 'usage',
      daily_used: options.usageAfterReserve.used,
      daily_remaining: options.usageAfterReserve.remaining,
      daily_limit: options.usageAfterReserve.limit,
    });
    endSse(res);
  }
}
