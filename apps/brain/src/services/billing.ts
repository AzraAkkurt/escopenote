import { getPool, hasDatabase } from '../db/pool.js';
import { config } from '../config.js';

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
}

export interface BillingResult {
  providerCostUsd: number;
  appTokensCharged: number;
}

const DEFAULT_HOLD_TOKENS = 5;

export function estimateHoldTokens(messageLength: number): number {
  const rough = Math.ceil(messageLength / 500) + 3;
  return Math.max(config.billingMinCharge, Math.max(DEFAULT_HOLD_TOKENS, rough));
}

export function estimateTokensFromText(text: string): TokenUsage {
  const chars = text.length;
  const inputTokens = Math.max(1, Math.ceil(chars / 4));
  const outputTokens = Math.max(1, Math.ceil(chars / 4));
  return { inputTokens, outputTokens };
}

export async function computeBilling(
  model: string,
  usage: TokenUsage,
): Promise<BillingResult> {
  let inputPrice = 0.5;
  let outputPrice = 2.0;

  if (hasDatabase()) {
    const pool = getPool();
    let { rows } = await pool.query<{ usd_per_1m_input: string; usd_per_1m_output: string }>(
      'SELECT usd_per_1m_input, usd_per_1m_output FROM billing_model_prices WHERE model = $1',
      [model],
    );
    if (!rows[0]) {
      ({ rows } = await pool.query(
        `SELECT usd_per_1m_input, usd_per_1m_output FROM billing_model_prices WHERE model = 'default'`,
      ));
    }
    if (rows[0]) {
      inputPrice = Number(rows[0].usd_per_1m_input);
      outputPrice = Number(rows[0].usd_per_1m_output);
    }
  }

  const providerCostUsd =
    (usage.inputTokens * inputPrice + usage.outputTokens * outputPrice) / 1_000_000;

  const raw = providerCostUsd * 10 * config.billingMarginMultiplier;
  const appTokensCharged = Math.max(config.billingMinCharge, Math.ceil(raw));

  return { providerCostUsd, appTokensCharged };
}
