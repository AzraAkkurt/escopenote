import type { FastifyReply, FastifyRequest } from 'fastify';
import { config } from '../config.js';

/** Legacy dev guard when Postgres is not configured. */
export async function requireApiKey(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  if (!config.apiKey) {
    return;
  }

  const header = request.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (token !== config.apiKey) {
    return reply.status(401).send({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid or missing API key.',
        retryable: false,
      },
    });
  }
}
