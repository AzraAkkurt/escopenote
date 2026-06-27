# Phase 10 — Polish & Ship

## Goal

Harden the desktop app for **daily use and distribution**: performance, accessibility, errors, and installer experience.

## Depends on

[Phase 9 — Backend integration](./phase-09-backend-integration.md)

## In scope

### UX polish

- Global keyboard shortcuts (new chat, navigate sections)
- Consistent empty/loading/error patterns across features
- Onboarding wizard: profile → optional first document → first plan (skippable)

### Accessibility

- Focus order on board and chat
- `aria-live` for streaming messages
- Contrast check for light/dark themes

### Performance

- Virtualize long message lists and library tables
- Debounce RAG search preview if needed
- Lazy-load heavy renderer chunks (board DnD, chat)

### Reliability

- Crash-safe: recover partial IPC writes
- Export/import local data (optional JSON backup)
- Auto-update strategy documented (electron-updater or manual)

### Packaging

- Signed builds (platform-specific, document steps)
- App icon, name **Escopenote**, version in About dialog
- First-run privacy summary (local data, what leaves device)

## Out of scope

- Mobile or web client
- Enterprise SSO

## Acceptance criteria

- [ ] Cold start under agreed budget (e.g. &lt; 3s on dev machine — tune per team)
- [ ] No critical a11y violations on shell, chat, board (axe or manual checklist)
- [ ] Installable build installs and launches on clean VM
- [ ] README covers dev setup, env vars, gateway URL
- [ ] All user-facing strings in `en` locale files; second locale optional

## Release checklist

- [ ] Phase 0–9 acceptance criteria re-verified
- [ ] API keys only on server / main proxy
- [ ] Changelog written
- [ ] Version bumped

## Reference

[Product requirements](../../product/requirements.md)
