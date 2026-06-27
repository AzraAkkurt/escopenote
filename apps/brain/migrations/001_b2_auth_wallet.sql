-- B2: users, wallets, usage ledger, billing prices, refresh tokens
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS wallets (
  user_id UUID PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
  balance_app_tokens INTEGER NOT NULL DEFAULT 0 CHECK (balance_app_tokens >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS wallet_grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  amount INTEGER NOT NULL CHECK (amount > 0),
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS billing_model_prices (
  model TEXT PRIMARY KEY,
  usd_per_1m_input NUMERIC(12, 6) NOT NULL,
  usd_per_1m_output NUMERIC(12, 6) NOT NULL,
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE
);

CREATE TABLE IF NOT EXISTS usage_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  feature TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('held', 'settled', 'failed', 'refunded')),
  model TEXT,
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  provider_cost_usd NUMERIC(12, 6) NOT NULL DEFAULT 0,
  app_tokens_charged INTEGER NOT NULL DEFAULT 0,
  hold_app_tokens INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  settled_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS usage_ledger_user_created_idx ON usage_ledger (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO billing_model_prices (model, usd_per_1m_input, usd_per_1m_output)
VALUES
  ('gemini-2.5-flash', 0.15, 0.60),
  ('gemini-2.0-flash', 0.10, 0.40),
  ('default', 0.50, 2.00)
ON CONFLICT (model) DO NOTHING;
