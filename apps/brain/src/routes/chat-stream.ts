import { randomUUID } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import type { ChatStreamRequest } from '@escopenote/contracts';
import { handleChatStream } from '../services/chat-stream-handler.js';
import {
  DailyLimitExceededError,
  reserveDailyUsage,
} from '../services/daily-quota-service.js';
import { hasDatabase } from '../db/pool.js';
import { chatStreamBodySchema } from '../schemas.js';

export async function chatStreamRoutes(app: FastifyInstance): Promise<void> {
  app.post('/v1/chat/stream', async (request, reply) => {
    const parsed = chatStreamBodySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: parsed.error.message,
          retryable: false,
        },
      });
    }

    const body: ChatStreamRequest = parsed.data;
    const requestIdHeader = request.headers['x-request-id'];
    const requestId =
      typeof requestIdHeader === 'string' && requestIdHeader.trim()
        ? requestIdHeader.trim()
        : randomUUID();
    const clientId = request.clientId;
    let usageAfterReserve: { used: number; limit: number; remaining: number } | undefined;

    if (hasDatabase() && clientId) {
      try {
        usageAfterReserve = await reserveDailyUsage(
          clientId,
          requestId,
          body.feature ?? 'chat',
        );
      } catch (e) {
        if (e instanceof DailyLimitExceededError) {
          return reply.status(429).send({
            error: {
              code: 'RATE_LIMITED',
              message: 'Günlük kullanım limitine ulaşıldı.',
              retryable: false,
              details: {
                daily_used: e.usage.used,
                daily_limit: e.usage.limit,
                daily_remaining: 0,
              },
            },
          });
        }
        throw e;
      }
    }

    reply.hijack();
    await handleChatStream(body, reply.raw, {
      requestId,
      usageAfterReserve,
    });
  });
}
