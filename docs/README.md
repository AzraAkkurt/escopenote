# Escopenote Documentation

Escopenote is a desktop application (Electron) that combines an AI-assisted study planner, a productivity system, and a privacy-oriented RAG chat. This folder is the canonical project documentation.

## Contents

| Section | Description |
|---------|-------------|
| [Product overview](./product/overview.md) | Vision, core features, and user-facing behavior |
| [Requirements](./product/requirements.md) | What users provide and what the system must deliver |
| [Architecture](./architecture/overview.md) | Hybrid local-vector + remote-AI model |
| [Data flow](./architecture/data-flow.md) | Ingestion, retrieval, and Gemini orchestration |
| [Embedding strategy](./architecture/embedding-strategy.md) | Local vs server-side embedding trade-offs |
| [Study planner](./features/study-planner.md) | AI-driven daily/weekly study plans |
| [RAG chat](./features/chat-rag.md) | Knowledge chat, formats, and web fallback |
| [Task board](./features/task-board.md) | Trello-style planning UI |
| [i18n & theming](./features/i18n-theming.md) | Language and theme support |
| [Recommended stack](./stack/recommended.md) | Desktop, vector DB, and embedding tooling |
| [Backend platform](./backend/README.md) | AI Application Runtime: mimari, teknoloji, fazlar (TR) |
| [Backend API & fazlar](./../backend/docs/README.md) | API sözleşmesi, B0–B6, Escopenote entegrasyonu |
| [Frontend phases](./frontend/README.md) | Phased Electron UI delivery (0–10) |
| [Platform support](./frontend/platform-support.md) | Linux & Windows targets |

## Design principles

1. **Move context, not data** — Raw files and embeddings stay on the user's device; only relevant chunks reach the backend.
2. **Server-side AI orchestration** — Gemini and workflows run on your backend; the client owns private storage.
3. **English-first content** — App copy and documentation are written in English; UI supports multiple languages.

## Source notes

Informal brainstorming lives in [notes/notes.md](./notes/notes.md) and [notes/arch_backend.md](./notes/arch_backend.md). Structured docs above supersede notes when they conflict.
