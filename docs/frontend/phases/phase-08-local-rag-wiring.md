# Phase 8 — Local RAG Wiring

## Goal

Connect the **chat and library UIs** to real **local retrieval** in the main process: chunk, embed, search — still sending only context to the gateway in Phase 9.

## Depends on

[Phase 6 — Chat UI](./phase-06-chat-ui.md), [Phase 7 — Knowledge library UI](./phase-07-knowledge-library.md)

## In scope (frontend-facing)

### Main process responsibilities

- Parse ingested files → chunks → embeddings → local vector DB
- `rag.search(query, topK)` returns chunk text + source metadata
- Progress events to library UI during real indexing

### Renderer changes

- Before send: call `rag.search` via IPC; show “Searching your files…” state
- Pass `relevant_chunks` to chat send handler (main forwards to gateway in Phase 9)
- Citation chips bind to real chunk IDs and open source preview
- Settings: top-K slider, optional “confirm before saving web results” toggle (UI only until Phase 9)

### Privacy UX

- Small notice in chat: “Searches happen on your device; only relevant excerpts are sent to AI”
- No full file path in outbound network payload (display path locally OK)

## Out of scope

- Choosing final vector DB (implement in main; UI stays agnostic)
- Server-side embedding (see [embedding strategy](../../architecture/embedding-strategy.md))

## Acceptance criteria

- [ ] Adding a TXT/MD file indexes to `ready` without mock timer
- [ ] Chat question retrieves at least one relevant chunk for seeded test doc
- [ ] Network tab (dev) shows requests contain chunk text, not full PDF binary
- [ ] Library status reflects real failures (corrupt file, unsupported type)
- [ ] Empty retrieval shows honest empty state in UI before optional web fallback (Phase 9)

## Reference

[Data flow](../../architecture/data-flow.md)

## Next phase

[Phase 9 — Backend integration](./phase-09-backend-integration.md)
