# Phase 9 — Backend Integration

## Goal

Replace mocks with the **AI gateway**: study plan generation, streaming chat with RAG context, and optional web fallback + save-to-library.

## Depends on

[Phase 4](./phase-04-study-planner.md) – [Phase 8](./phase-08-local-rag-wiring.md)

## In scope

### Settings

- Gateway base URL (validated)
- Connection test button
- Offline mode banner when gateway unreachable

### Study planner

- `POST /planner/generate` (or equivalent) with profile + scope
- Handle loading, timeout, validation errors
- “Apply to board” sends AI task drafts to Phase 5 board API

### Chat

- Main process:
  1. Local `rag.search`
  2. POST message + `relevant_chunks` to gateway
  3. Stream SSE/WebSocket response to renderer
- Web fallback: UI shows `web` badge when response metadata says so
- Save-to-library: modal confirm → main indexes summary chunk locally

### Error handling

- Rate limit, 401, 5xx → user-friendly toast + retry
- Never expose Gemini API key in renderer or logs

## Out of scope

- User accounts / billing (unless product adds later)
- Server-side storage of user documents

## Frontend deliverables

- `api/gateway-client.ts` in **main** only
- Renderer uses IPC: `chat.send`, `planner.generate`
- Unified `RequestError` type surfaced in UI

## Acceptance criteria

- [ ] End-to-end: ingest doc → ask question → streamed answer with citations
- [ ] Planner generates real week plan from profile via gateway
- [ ] Web fallback path visible in UI when local retrieval insufficient
- [ ] User can decline saving web result; accept triggers re-index
- [ ] App usable offline for local library browse; chat shows offline state

## Reference

[Architecture overview](../../architecture/overview.md), [Study planner](../../features/study-planner.md)

## Next phase

[Phase 10 — Polish & ship](./phase-10-polish-ship.md)
