import type { FastifyReply, FastifyRequest } from 'fastify';
import { hasDatabase } from '../db/pool.js';

const UUID_V4_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

declare module 'fastify' {
  interface FastifyRequest {
    clientId?: string;
  }
}

export async function requireClientId(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  if (!hasDatabase()) {
    return;
  }

  const header = request.headers['x-client-id'];
  const clientId = typeof header === 'string' ? header.trim() : '';
  if (!clientId || !UUID_V4_RE.test(clientId)) {
    return reply.status(401).send({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Missing or invalid X-Client-Id header.',
        retryable: false,
      },
    });
  }

  request.clientId = clientId;
}
