import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { getPool, hasDatabase } from './pool.js';

/** App root (apps/brain); works in tsx dev and bundled dist/index.js in Docker. */
const MIGRATIONS_DIR = join(process.cwd(), 'migrations');

export async function runMigrations(): Promise<void> {
  if (!hasDatabase()) {
    return;
  }

  const pool = getPool();
  const migrationFiles = ['001_b2_auth_wallet.sql', '002_daily_usage.sql'];
  try {
    for (const file of migrationFiles) {
      const sql = await readFile(join(MIGRATIONS_DIR, file), 'utf8');
      await pool.query(sql);
    }
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === 'ECONNREFUSED') {
      throw new Error(
        'Postgres is not reachable (DATABASE_URL). Start it with: cd apps/brain && npm run db:up',
        { cause: error },
      );
    }
    throw error;
  }
}
