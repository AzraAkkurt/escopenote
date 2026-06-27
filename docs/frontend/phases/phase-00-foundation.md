# Phase 0 — Foundation

## Goal

Bootstrap a maintainable **Electron + modern UI framework** project with dev/build scripts and quality gates.

## In scope

- Monorepo or single-package layout (decide and document in repo `README`)
- Electron **main**, **preload**, and **renderer** entry points
- Framework choice (React recommended for ecosystem; Vue/Svelte acceptable)
- TypeScript, ESLint, Prettier
- Dev hot reload for renderer
- Production build pipeline (electron-builder or equivalent)
- Environment config pattern (`dev` / `prod` gateway URL — no API keys in client)

## Out of scope

- Feature screens beyond a placeholder window
- IPC contracts beyond a health-check ping
- Vector DB or embeddings

## Deliverables

| Item | Done when |
|------|-----------|
| `npm run dev` | Opens desktop window with renderer |
| `npm run build` | Produces installable artifact (or staged build) |
| Folder structure | `main/`, `preload/`, `renderer/` (or documented equivalent) |
| CI stub | Lint + typecheck on push (optional but recommended) |

## Suggested structure

```txt
apps/desktop/
  main/           # Node: window, IPC registry
  preload/        # contextBridge exposes safe API
  renderer/       # UI app (routes, pages, components)
  shared/         # types shared main ↔ renderer
```

## Acceptance criteria

- [ ] App launches on Linux (primary dev target)
- [ ] `contextIsolation: true`, `nodeIntegration: false` in renderer
- [ ] Preload exposes only typed, whitelisted methods
- [ ] Renderer has no direct filesystem or `child_process` access

## Notes

- Prefer **Vite** (or similar) for renderer bundling.
- Lock Electron version in repo; document upgrade process later.

## Next phase

[Phase 1 — Shell & navigation](./phase-01-shell-navigation.md)
