import { config as loadEnv } from 'dotenv';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(__dirname, '../.env') });

function parseOrigins(raw: string | undefined): string[] | true {
  if (!raw || raw === '*') {
    return true;
  }
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
}

const databaseUrl = process.env.DATABASE_URL?.trim() || '';

export const config = {
  port: Number(process.env.PORT ?? 3000),
  host: process.env.HOST ?? '127.0.0.1',
  geminiApiKey: process.env.GEMINI_API_KEY?.trim() || '',
  geminiModel: process.env.GEMINI_MODEL?.trim() || 'gemini-2.5-flash',
  apiKey: process.env.ESCOPENOTE_API_KEY?.trim() || '',
  corsOrigins: parseOrigins(process.env.CORS_ORIGINS),
  version: '0.2.0',
  databaseUrl,
  dailyUsageLimit: Number(process.env.DAILY_USAGE_LIMIT ?? 100),
  billingMinCharge: Number(process.env.BILLING_MIN_CHARGE ?? 1),
  billingMarginMultiplier: Number(process.env.BILLING_MARGIN_MULTIPLIER ?? 1),
} as const;

export function hasGemini(): boolean {
  return config.geminiApiKey.length > 0;
}
