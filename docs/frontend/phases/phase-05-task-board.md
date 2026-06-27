# Phase 5 — Task Board UI

## Goal

Implement a **Trello-like** board for daily and weekly tasks with manual CRUD and drag-and-drop; prepare slots for AI-suggested cards.

## Depends on

[Phase 2](./phase-02-design-system-i18n.md), [Phase 3](./phase-03-data-layer-ipc.md)

## In scope

### Task model (UI)

| Field | Control |
|-------|---------|
| Title | Inline edit |
| Priority | Badge / dropdown (low, medium, high) |
| Status | Todo / done (extend to columns later) |
| Scope | Daily vs weekly board tab |

### Board UX

- Column layout: at minimum **To do** | **Done** (optional **Doing** later)
- Drag card between columns and reorder within column
- Add card, delete card, keyboard focus for a11y basics
- Tab switch: **Daily board** | **Weekly board**
- “Suggest tasks from plan” button (disabled or mock until Phase 9)

### AI draft pattern (UI only)

- Cards from AI show `draft` badge
- Accept → becomes normal card; Dismiss → remove

## Out of scope

- Real-time multi-user collaboration
- Server-synced board state

## Libraries (suggested)

- `@dnd-kit/core` or similar for accessible drag-and-drop

## Components

- `BoardTabs`, `BoardColumn`, `TaskCard`, `TaskCardEditor`
- `PriorityBadge`, `AddTaskInline`
- `AiDraftCard` (accept/dismiss actions)

## Acceptance criteria

- [ ] Daily and weekly boards persist separately in local storage
- [ ] Drag-and-drop updates status and order; survives restart
- [ ] Priority visible on card face
- [ ] Done column clearly distinct (theme tokens)
- [ ] Optional: one planner block → one task card (manual “import from plan” OK for this phase)

## Reference

[Task board feature](../../features/task-board.md)

## Next phase

[Phase 6 — Chat UI](./phase-06-chat-ui.md)
