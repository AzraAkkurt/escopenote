import { getPool } from '../db/pool.js';
import { config } from '../config.js';

export interface DailyUsageInfo {
  used: number;
  limit: number;
  remaining: number;
}

export class DailyLimitExceededError extends Error {
  readonly code = 'RATE_LIMITED' as const;
  constructor(public readonly usage: DailyUsageInfo) {
    super('Daily usage limit exceeded');
  }
}

export async function getDailyUsage(clientId: string): Promise<DailyUsageInfo> {
  const pool = getPool();
  const limit = config.dailyUsageLimit;
  const { rows } = await pool.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count
     FROM client_daily_usage
     WHERE client_id = $1 AND usage_date = CURRENT_DATE`,
    [clientId],
  );
  const used = Number(rows[0]?.count ?? 0);
  return {
    used,
    limit,
    remaining: Math.max(0, limit - used),
  };
}

export async function reserveDailyUsage(
  clientId: string,
  requestId: string,
  feature: string,
): Promise<DailyUsageInfo> {
  const pool = getPool();
  const limit = config.dailyUsageLimit;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [
      `${clientId}:${new Date().toISOString().slice(0, 10)}`,
    ]);

    const { rows } = await client.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
       FROM client_daily_usage
       WHERE client_id = $1 AND usage_date = CURRENT_DATE`,
      [clientId],
    );
    const used = Number(rows[0]?.count ?? 0);
    if (used >= limit) {
      await client.query('ROLLBACK');
      throw new DailyLimitExceededError({ used, limit, remaining: 0 });
    }

    await client.query(
      `INSERT INTO client_daily_usage (client_id, request_id, feature)
       VALUES ($1, $2, $3)
       ON CONFLICT (request_id) DO NOTHING`,
      [clientId, requestId, feature],
    );

    await client.query('COMMIT');
    return { used: used + 1, limit, remaining: Math.max(0, limit - used - 1) };
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}
