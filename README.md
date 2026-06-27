# Escopenote

AI-assisted study planner desktop app with local RAG chat and Trello-style task boards. **Linux** and **Windows** supported.

## Repository layout

| Path | Description |
|------|-------------|
| [docs/](./docs/) | Product and architecture documentation |
| [backend/docs/](./backend/docs/) | Brain API contract, phases B0–B6, Escopenote integration |
| [apps/desktop/](./apps/desktop/) | Electron + React application |
| [apps/brain/](./apps/brain/) | Brain API (Gemini + SSE); see [apps/brain/README.md](./apps/brain/README.md) |
| [apps/gateway/](./apps/gateway/) | Legacy dev mock (optional; same port as brain) |
| [packages/contracts/](./packages/contracts/) | Shared API types |

## Quick start

```bash
cd packages/contracts && npm install && npm run build
cd ../../apps/brain && cp .env.example .env && npm install
cd ../desktop
cp .env.example .env
npm install
npm run dev:brain   # or dev:gateway (not both on port 3000)
npm run dev
```

## Documentation

- [Docs index](./docs/README.md)
- [Backend API & phases](./backend/docs/README.md)
- [Frontend phases](./docs/frontend/README.md)

## License

TBD
