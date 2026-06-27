# Veri Modeli (PostgreSQL)

Brain API kalıcı durumu. B1’de minimal; B2’de cüzdan tamamlanır.

---

## ER özeti

```txt
users ──┬── wallets
        ├── refresh_tokens
        └── usage_ledger ─── billing_model_prices (referans)

runs (opsiyonel B1) — debug / Langfuse correlation
```

---

## Tablolar

### `users`

| Sütun | Tip | Not |
|-------|-----|-----|
| `id` | UUID PK | |
| `email` | TEXT UNIQUE | |
| `password_hash` | TEXT | |
| `created_at` | TIMESTAMPTZ | |

### `wallets`

| Sütun | Tip | Not |
|-------|-----|-----|
| `user_id` | UUID PK FK | |
| `balance_app_tokens` | INTEGER | ≥ 0 |
| `updated_at` | TIMESTAMPTZ | |

### `wallet_grants`

| Sütun | Tip | Not |
|-------|-----|-----|
| `id` | UUID PK | |
| `user_id` | UUID FK | |
| `amount` | INTEGER | + kredi |
| `reason` | TEXT | `welcome`, `purchase`, `admin` |
| `created_at` | TIMESTAMPTZ | |

### `usage_ledger`

| Sütun | Tip | Not |
|-------|-----|-----|
| `id` | UUID PK | |
| `request_id` | TEXT UNIQUE | `X-Request-Id` |
| `user_id` | UUID FK | |
| `feature` | TEXT | `chat`, `note_agent`, `planner`, `cloud_backup` |
| `status` | TEXT | `held`, `settled`, `failed`, `refunded` |
| `model` | TEXT | |
| `input_tokens` | INTEGER | |
| `output_tokens` | INTEGER | |
| `provider_cost_usd` | NUMERIC(12,6) | |
| `app_tokens_charged` | INTEGER | |
| `hold_app_tokens` | INTEGER | |
| `created_at` | TIMESTAMPTZ | |
| `settled_at` | TIMESTAMPTZ | |

İndeks: `(user_id, created_at)`, `(request_id)`.

### `billing_model_prices`

| Sütun | Tip | Not |
|-------|-----|-----|
| `model` | TEXT PK | `gemini-2.0-flash` |
| `usd_per_1m_input` | NUMERIC | |
| `usd_per_1m_output` | NUMERIC | |
| `effective_from` | DATE | |

### `refresh_tokens`

| Sütun | Tip |
|-------|-----|
| `id` | UUID PK |
| `user_id` | UUID FK |
| `token_hash` | TEXT |
| `expires_at` | TIMESTAMPTZ |

### `runs` (B1 observability)

| Sütun | Tip | Not |
|-------|-----|-----|
| `id` | UUID PK | |
| `request_id` | TEXT | |
| `user_id` | UUID nullable | B2 |
| `feature` | TEXT | |
| `status` | TEXT | |
| `langfuse_trace_id` | TEXT | opsiyonel |
| `created_at` | TIMESTAMPTZ | |

---

## Redis (önbellek)

| Key | TTL | Amaç |
|-----|-----|------|
| `ratelimit:{user_id}` | 1 dk | İstek sayacı |
| `hold:{request_id}` | 5 dk | Hold tutarı |
| `session:{session_id}` | 24 s | Kısa sohbet özeti (B3) |

---

## Migrasyon sırası

| Faz | Migrasyon |
|-----|-----------|
| B1 | `runs` |
| B2 | `users`, `wallets`, `usage_ledger`, `billing_model_prices`, `refresh_tokens` |
| B5 | `wallet_grants`, ödeme harici id |
| B6 | `usage_ledger.feature` + `cloud_backup` satırları |

İlgili: [04-api-kimlik-ve-cuzdan.md](./04-api-kimlik-ve-cuzdan.md)
