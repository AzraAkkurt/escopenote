# Phase 6 — Chat UI

## Goal

Build a **modern chat experience** in the renderer with streaming UX, source citations UI, and local session history — backend mocked.

## Depends on

[Phase 2](./phase-02-design-system-i18n.md), [Phase 3](./phase-03-data-layer-ipc.md)

## In scope

### Layout

- Session list (sidebar or drawer): new chat, rename, delete
- Message list: user / assistant bubbles
- Composer: multiline input, send, stop generation
- Streaming: token-by-token or chunk display with cursor/typing state

### Message metadata (UI)

- **Source chips** — file name + excerpt preview (from mock chunks)
- **Source type badge** — `local` | `web` (styling distinct)
- Timestamp, copy message action

### Local history

- Persist threads in `chat.sessions` via IPC
- Clear history action in settings (with confirm modal)

### Mock streaming

- `ReadableStream` or timed fake chunks from fixture
- Simulate abort mid-stream

## Out of scope

- Real retrieval or Gemini (Phases 8–9)
- Web search trigger logic

## Components

- `ChatLayout`, `SessionList`, `MessageList`, `MessageBubble`
- `Composer`, `StreamingIndicator`
- `CitationChip`, `SourcePreviewPopover`

## Acceptance criteria

- [ ] User can create multiple sessions and switch between them
- [ ] Assistant message streams in without freezing UI
- [ ] Stop button cancels mock stream
- [ ] At least one mock message shows two citation chips
- [ ] `local` vs `web` badges render with different theme colors
- [ ] Long threads scroll correctly; composer pinned to bottom

## Reference

[RAG chat feature](../../features/chat-rag.md)

## Next phase

[Phase 7 — Knowledge library UI](./phase-07-knowledge-library.md)
