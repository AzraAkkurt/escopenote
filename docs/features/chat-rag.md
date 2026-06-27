# RAG Chat

## Purpose

Provide a **modern chat UI** where answers are grounded in the user's own documents, with optional web augmentation and local learning.

## Knowledge base

### Ingest formats

| Format | Notes |
|--------|--------|
| PDF | Parse text; handle scanned PDFs later if needed |
| HTML | Strip boilerplate where possible |
| TXT, MD | Direct chunking |
| CSV, JSON | Structured chunking or row/summary strategy |
| DOCX | Extract text pipeline |

Pipeline (local):

```txt
file → parse → chunk → embed → vector index
```

### Retrieval

- Similarity search (top-K) on the device
- Only **relevant chunks** sent to the backend with the user message

## When RAG is not enough

1. Detect low confidence or empty retrieval
2. Run **web research** (server-side tool)
3. Answer the user
4. Optionally **index** distilled facts back into the local vector DB

Define UX for: user approval before saving web results vs automatic save.

## Chat UX

- Streaming responses
- Optional “typing” indicator
- Citations or source snippets from retrieved chunks
- Clear distinction between “from your files” vs “from web”

## Backend / Gemini

- Orchestrator merges: system prompt + user question + `relevant_chunks`
- No requirement to store chat or chunks server-side after the request
- API keys for Gemini live only on the backend

## Privacy summary

| Component | Location |
|-----------|----------|
| Raw files | Client disk |
| Embeddings & index | Client |
| Gemini API key | Server |
| Context per turn | Transient on server |
