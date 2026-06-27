import type { FastifyInstance } from 'fastify';
import type { HealthResponse } from '@escopenote/contracts';
import { hasDatabase } from '../db/pool.js';
import { config, hasGemini } from '../config.js';

export async function healthRoutes(app: FastifyInstance): Promise<void> {
  app.get('/health', async (_request, reply) => {
    const body: HealthResponse = {
      ok: true,
      version: config.version,
      api: 'v1',
      capabilities: hasDatabase()
        ? ['chat.stream', 'planner.generate', 'auth', 'wallet']
        : ['chat.stream', 'planner.generate'],
      provider: hasGemini() ? 'gemini' : 'mock',
    };
    return reply.send(body);
  });
}
