# Frontend Development Phases

Phased plan for the **Electron renderer** (UI layer). Each phase builds on the previous one; later AI and RAG work assumes Phase 3 (IPC + local storage) is stable.

**Platforms:** Linux and Windows are first-class. See [platform support](./platform-support.md).

## Phase map

| Phase | Doc | Focus | Depends on |
|-------|-----|--------|------------|
| 0 | [Foundation](./phases/phase-00-foundation.md) | Repo scaffold, Electron, framework, tooling | — |
| 1 | [Shell & navigation](./phases/phase-01-shell-navigation.md) | App layout, routes, empty feature shells | 0 |
| 2 | [Design system & i18n](./phases/phase-02-design-system-i18n.md) | Tokens, themes, UI kit, en/tr | 1 |
| 3 | [Data layer & IPC](./phases/phase-03-data-layer-ipc.md) | Settings/storage IPC, hooks, Zod | 0–2 |
| 4 | [Study planner UI](./phases/phase-04-study-planner.md) | Profile, day/week plans, mock generate | 2–3 |
| 5 | [Task board UI](./phases/phase-05-task-board.md) | Kanban, DnD, daily/weekly, drafts | 2–3 |
| 6 | [Chat UI](./phases/phase-06-chat-ui.md) | Sessions, streaming mock, citations | 2–3 |
| 2 | [Design system & i18n](./phases/phase-02-design-system-i18n.md) | Tokens, themes, base components, strings | 1 |
| 3 | [Data layer & IPC](./phases/phase-03-data-layer-ipc.md) | Main ↔ renderer bridge, local persistence | 0, 1 |
| 4 | [Study planner UI](./phases/phase-04-study-planner.md) | Profile forms, day/week plan views | 2, 3 |
| 5 | [Task board UI](./phases/phase-05-task-board.md) | Kanban, daily/weekly boards, drag-and-drop | 2, 3 |
| 6 | [Chat UI](./phases/phase-06-chat-ui.md) | Threads, streaming, citations (mocked backend) | 2, 3 |
| 7 | [Knowledge library UI](./phases/phase-07-knowledge-library.md) | Ingest, file list, indexing progress | 2, 3 |
| 8 | [Local RAG wiring](./phases/phase-08-local-rag-wiring.md) | Retrieval UI hooks, chunk preview, privacy UX | 6, 7 |
| 9 | [Backend integration](./phases/phase-09-backend-integration.md) | Real gateway: planner, chat, web fallback | 4–8 |
| 10 | [Polish & ship](./phases/phase-10-polish-ship.md) | a11y, errors, perf, packaging | 9 |

## Suggested timeline (conceptual)

```txt
Phase 0–1   → Runnable desktop app with navigation
Phase 2–3   → Themed UI + local settings (no AI yet)
Phase 4–7   → Feature UIs with mocks / fixtures
Phase 8–9   → End-to-end AI + RAG
Phase 10    → Release candidate
```

## Cross-cutting rules (all phases)

- **English-first** copy in components; strings via i18n keys ([i18n & theming](../features/i18n-theming.md)).
- **No secrets in renderer** — API keys and Gemini calls only through main process or backend gateway.
- **Theme tokens only** — no hard-coded colors in feature screens.
- **Human-editable AI output** — planner and board treat AI results as drafts until the user saves.

## Related docs

- [Product overview](../product/overview.md)
- [Architecture](../architecture/overview.md)
- [Recommended stack](../stack/recommended.md)
