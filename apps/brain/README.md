# Escopenote Brain API

Production-oriented AI gateway for the Escopenote desktop app.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health + capabilities |
| POST | `/v1/auth/register` | Create account (B2) |
| POST | `/v1/auth/login` | Login |
| POST | `/v1/auth/refresh` | Refresh access token |
| GET | `/v1/wallet` | Balance + period usage (JWT) |
| POST | `/v1/chat/stream` | SSE chat (RAG chunks in body) |
| POST | `/v1/planner/generate` | Study plan JSON |

Contract: [backend/docs](../../backend/docs/README.md)

## Quick start

```bash
# Postgres (port 5433 — avoids conflict with other local Postgres on 5432)
docker compose -f ../../infra/compose/docker-compose.yml up -d postgres

cd packages/contracts && npm install && npm run build
cd ../../apps/brain
cp .env.example .env
# Set GEMINI_API_KEY in .env
npm install
npm run dev
```

Desktop: **Ayarlar → Hesap ve kredi** → kayıt/giriş. **Ağ geçidi URL** = `http://127.0.0.1:3001`.

Use **either** `npm run dev:mock` (legacy mock on 3000) **or** `npm run dev:brain` from `apps/desktop` (default 3001).

Without `DATABASE_URL`, auth and billing are disabled (open dev mode or legacy API key).

Without `GEMINI_API_KEY`, responses match the dev mock (no Google billing).

## Environment

See [.env.example](./.env.example).

## Docker (full stack)

```bash
docker compose -f ../../infra/compose/docker-compose.yml up --build
```
