-- Daily usage quota per client (replaces auth/wallet billing for chat)
CREATE TABLE IF NOT EXISTS client_daily_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id TEXT NOT NULL,
  request_id TEXT NOT NULL UNIQUE,
  feature TEXT NOT NULL,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS client_daily_usage_client_date_idx
  ON client_daily_usage (client_id, usage_date);
