import Fastify from 'fastify';
import cors from '@fastify/cors';
import { config, hasGemini } from './config.js';
import { runMigrations } from './db/migrate.js';
import { hasDatabase, closePool } from './db/pool.js';
import { requireApiKey } from './middleware/api-key-auth.js';
import { requireClientId } from './middleware/client-id-auth.js';
import { healthRoutes } from './routes/health.js';
import { usageRoutes } from './routes/usage.js';
import { chatStreamRoutes } from './routes/chat-stream.js';
import { plannerRoutes } from './routes/planner.js';

const app = Fastify({
  logger: true,
  bodyLimit: 2 * 1024 * 1024,
});

await app.register(cors, {
  origin: config.corsOrigins,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Request-Id', 'X-Client-Version', 'X-Client-Id'],
});

if (hasDatabase()) {
  await runMigrations();
  app.log.info('Database migrations applied');
}

await app.register(healthRoutes);

await app.register(async (v1) => {
  if (hasDatabase()) {
    v1.addHook('preHandler', requireClientId);
  } else {
    v1.addHook('preHandler', requireApiKey);
  }
  await v1.register(usageRoutes);
  await v1.register(chatStreamRoutes);
  await v1.register(plannerRoutes);
});

const shutdown = async () => {
  await app.close();
  await closePool();
  process.exit(0);
};

process.on('SIGINT', () => void shutdown());
process.on('SIGTERM', () => void shutdown());

try {
  await app.listen({ port: config.port, host: config.host });
  app.log.info(
    {
      provider: hasGemini() ? 'gemini' : 'mock',
      model: config.geminiModel,
      database: hasDatabase(),
      quota: hasDatabase() ? `client-id (${config.dailyUsageLimit}/day)` : config.apiKey ? 'api-key' : 'open',
    },
    `Escopenote Brain listening on http://${config.host}:${config.port}`,
  );
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
