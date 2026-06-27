# Recommended Stack

Aligned with [architecture overview](../architecture/overview.md) and [embedding strategy](../architecture/embedding-strategy.md).

## Desktop shell

| Option | Notes |
|--------|--------|
| **Electron** | Primary choice per project notes; mature ecosystem |
| **Tauri** | Lighter binary, Rust shell; good if bundle size matters |

## Local vector database

| Library | Notes |
|---------|--------|
| **LanceDB** | Strong fit for embedded/desktop |
| **ChromaDB** | Simple local API |
| **Qdrant** | Local mode available |

Pick one early; abstract behind a small storage interface to allow migration.

## Local embeddings

| Tool | Role |
|------|------|
| **Transformers.js** | Run small models in renderer or worker |
| **ONNX Runtime** | Fast inference on CPU |
| **llama.cpp** | If you already use GGUF tooling |

Example models: `bge-small`, `nomic-embed`, `e5-small`.

## Backend

- Node or Python service (team preference)
- **Gemini API** for generation and tool calling
- Orchestration layer: agents, workflows, web-search tool
- No long-term storage of user vectors or raw uploads

## Frontend (inside Electron)

- Modern framework (React/Vue/Svelte) — choose when scaffolding the app
- State: local SQLite or JSON + file store for settings and boards
- Secure IPC between main process (filesystem, vector DB) and renderer

## External services

| Service | Usage |
|---------|--------|
| Gemini API | Planning, chat, reasoning |
| Web search API | RAG fallback only |

Keep API keys server-side; desktop talks to your gateway over HTTPS.

## Not chosen yet (decide at scaffold time)

- Exact UI framework
- Monorepo vs single package
- Auth / licensing (if any cloud features)
