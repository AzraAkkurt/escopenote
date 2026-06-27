# Phase 3 — Data Layer & IPC

## Goal

Define a **safe, typed bridge** between renderer and main process, plus **local persistence** for settings and feature data.

## Depends on

[Phase 0](./phase-00-foundation.md), [Phase 1](./phase-01-shell-navigation.md)

## In scope

- Preload API surface (example channels):
  - `settings.get` / `settings.set`
  - `storage.read` / `storage.write` (namespaced JSON or SQLite via main)
  - `dialog.openFile` (for later ingest)
  - `app.getPaths` (user data dir)
- Zod (or similar) validation on IPC payloads in **main**
- Renderer data layer: thin hooks (`useSettings`, `useLocalStore`)
- Persist: theme, locale, window bounds (optional)
- Error boundary + toast for IPC failures
- Mock/fixture mode flag for UI development without backend

## Out of scope

- Vector DB access from renderer directly
- Network calls to Gemini from renderer

## Data namespaces (local)

| Namespace | Contents |
|-----------|----------|
| `settings` | theme, locale, gateway URL |
| `planner.profile` | subjects, exams, hours, difficulty |
| `planner.plans` | generated day/week plans (JSON) |
| `board.daily` / `board.weekly` | task arrays |
| `chat.sessions` | thread metadata + messages (local history) |
| `library.index` | file metadata (path, status, chunk count) |

## Deliverables

- `shared/ipc-types.ts` — single source of truth
- Main handlers registered in one module
- Dev-only IPC logging (redact paths in production builds)

## Acceptance criteria

- [ ] Theme/locale survive app restart
- [ ] Invalid IPC payload rejected in main with clear error to UI
- [ ] Renderer cannot invoke arbitrary channel names
- [ ] Fixture JSON loadable when `VITE_USE_FIXTURES=true`

## Architecture alignment

Sensitive operations stay in **main**; renderer only calls preload API ([architecture overview](../../architecture/overview.md)).

## Next phase

[Phase 4 — Study planner UI](./phase-04-study-planner.md)
