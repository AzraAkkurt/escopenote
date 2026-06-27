# Phase 1 — Shell & Navigation

## Goal

Ship the **application chrome**: sidebar or top nav, primary routes, and empty states for every major feature area.

## Depends on

[Phase 0 — Foundation](./phase-00-foundation.md)

## In scope

- App shell: header, navigation, content area
- Routes / views:
  - **Dashboard** (summary placeholder)
  - **Study planner**
  - **Task board**
  - **Chat**
  - **Knowledge library**
  - **Settings**
- Deep-linkable routes within Electron (`#/planner`, etc. or path-based router)
- Window controls integration (minimize / maximize / close) if custom title bar
- Basic responsive layout for minimum window size (e.g. 1024×640)

## Out of scope

- Real data persistence
- Theming beyond default CSS
- Drag-and-drop on boards

## Deliverables

| Screen | Empty state message |
|--------|---------------------|
| Dashboard | “No plan for today yet” |
| Planner | CTA to set up profile |
| Board | Empty column template |
| Chat | “Start a conversation” |
| Library | “Add your first document” |
| Settings | Theme/locale placeholders |

## Components (minimum)

- `AppShell`, `NavItem`, `PageHeader`, `EmptyState`
- Route guard: unknown path → dashboard

## Acceptance criteria

- [ ] User can navigate all six areas without reload
- [ ] Active nav item reflects current route
- [ ] Shell works at min window size without broken layout
- [ ] No console errors on route changes

## Next phase

[Phase 2 — Design system & i18n](./phase-02-design-system-i18n.md)
