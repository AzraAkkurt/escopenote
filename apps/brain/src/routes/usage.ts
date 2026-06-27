import type { FastifyInstance } from 'fastify';
import { getDailyUsage } from '../services/daily-quota-service.js';

export async function usageRoutes(app: FastifyInstance): Promise<void> {
  app.get('/v1/usage', async (request, reply) => {
    const clientId = request.clientId;
    if (!clientId) {
      return reply.status(401).send({
        error: { code: 'UNAUTHORIZED', message: 'Missing client id.', retryable: false },
      });
    }

    const usage = await getDailyUsage(clientId);
    return reply.send({
      daily_used: usage.used,
      daily_remaining: usage.remaining,
      daily_limit: usage.limit,
    });
  });
}
