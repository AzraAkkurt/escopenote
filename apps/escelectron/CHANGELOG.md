# Changelog

## 1.0.1 — 2026-06-27

Production server build with fixed VPS Brain gateway URL.

### Changed

- Default gateway locked to `http://31.57.46.24:3001` in `dist:server` builds
- Gateway URL read-only in Settings for packaged server releases

## 1.0.0 — 2026-05-21

First release candidate for the Escopenote desktop app (Linux & Windows).

### Added

- Study planner with profile, day/week plans, gateway-backed generation
- Kanban task board with drag-and-drop and plan import
- RAG chat with local retrieval, streaming gateway replies, web fallback UX
- Knowledge library with real indexing (TXT, MD, HTML, CSV, JSON)
- Settings: theme, locale, gateway URL, RAG top-K, data export/import
- Onboarding wizard and first-run privacy summary
- Global keyboard shortcuts (Ctrl/⌘+1–6, Ctrl/⌘+N, ?)
- Offline gateway banner; dev AI gateway (`apps/gateway`)

### Security

- Context isolation, sandboxed renderer, no API keys in client
- Atomic JSON writes for settings and storage
