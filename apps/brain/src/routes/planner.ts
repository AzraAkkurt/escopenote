import type { FastifyInstance } from 'fastify';
import type { PlannerGenerateRequest } from '@escopenote/contracts';
import { hasGemini } from '../config.js';
import { generatePlanGemini } from '../services/gemini-planner.js';
import { generatePlanMock } from '../services/planner-mock.js';
import { plannerBodySchema } from '../schemas.js';

export async function plannerRoutes(app: FastifyInstance): Promise<void> {
  app.post('/v1/planner/generate', async (request, reply) => {
    const parsed = plannerBodySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: parsed.error.message,
          retryable: false,
        },
      });
    }

    const body = parsed.data as PlannerGenerateRequest;
    const result = hasGemini() ? await generatePlanGemini(body) : generatePlanMock(body);
    return reply.send(result);
  });
}
