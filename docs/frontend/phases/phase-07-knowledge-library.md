# Phase 7 — Knowledge Library UI

## Goal

Let users **add, monitor, and manage** documents that will feed the local RAG index — UI and IPC first; indexing pipeline wired in Phase 8.

## Depends on

[Phase 2](./phase-02-design-system-i18n.md), [Phase 3](./phase-03-data-layer-ipc.md)

## In scope

### Library screen

- File list table/cards: name, type, size, status, added date
- Status enum: `pending` | `indexing` | `ready` | `failed`
- Actions: add files, remove, re-index (buttons call main IPC stubs)
- Bulk add via file dialog (multi-select)

### Supported types (display)

PDF, HTML, TXT, MD, CSV, JSON, DOCX — show icon per type

### Ingest flow (UI)

1. User picks files → list shows `pending`
2. Progress bar or per-file spinner during `indexing` (mock progress OK)
3. `ready` → enabled for chat retrieval; `failed` → error tooltip + retry

### Detail drawer (optional)

- Chunk count, last indexed time
- Preview first N characters of parsed text (from main)

## Out of scope

- Real chunking/embedding (Phase 8)
- Uploading raw files to cloud

## IPC stubs (main)

- `library.addFiles(paths: string[])`
- `library.remove(id: string)`
- `library.reindex(id: string)`
- `library.list()` → metadata array
- Events: `library:progress` pushed to renderer during indexing

## Components

- `LibraryTable`, `FileTypeIcon`, `IndexStatusBadge`
- `AddFilesButton`, `IndexingProgress`
- `FileDetailDrawer`

## Acceptance criteria

- [ ] User can add files via system dialog; list updates
- [ ] Mock indexing transitions pending → indexing → ready
- [ ] Failed state shows error message and retry works (mock)
- [ ] Remove file removes from list and confirms destructive action
- [ ] Library empty state matches Phase 1 CTA style

## Reference

[RAG chat — ingest formats](../../features/chat-rag.md)

## Next phase

[Phase 8 — Local RAG wiring](./phase-08-local-rag-wiring.md)
