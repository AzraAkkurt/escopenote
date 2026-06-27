# Data Flow

## Method: Local vector DB + remote AI

This is the **preferred** approach for Escopenote.

### Supported local vector stores (examples)

- ChromaDB
- Qdrant (local mode)
- LanceDB
- SQLite-vss
- Weaviate (embedded)

Exact choice is documented in [recommended stack](../stack/recommended.md).

---

## Flow 1 — Document ingestion

```txt
User adds file (PDF, MD, etc.)
    → chunk
    → embedding (preferably on device)
    → store in local vector DB
```

**All ingestion steps run locally** unless you explicitly choose server-side embedding for some file types.

---

## Flow 2 — Question answering

### Step 1 — User asks

Example: *"What is the cancellation clause in this contract?"*

### Step 2 — Local retrieval

On the client:

```txt
topK similarity search against local index
```

### Step 3 — Context-only request to backend

Only retrieved passages are sent, for example:

```json
{
  "context": [
    "Section 8...",
    "In case of cancellation..."
  ]
}
```

### Step 4 — Backend calls Gemini

```ts
gemini.generateContent({
  contents: [
    userQuestion,
    retrievedContext
  ]
})
```

(Response streams back to the desktop UI.)

---

## Flow 3 — Web fallback and learning

When local RAG has insufficient coverage:

1. Backend or client triggers **web research** (tool/workflow on server)
2. Model forms an answer
3. **New useful text** can be chunked and indexed **locally** so the next query hits RAG instead of the web

Keep write-back policies explicit (user confirm vs automatic) in implementation.

---

## Outcomes

| Stakeholder | Benefit |
|-------------|---------|
| **User** | Data stays on device; stronger privacy and compliance story |
| **Product owner** | Orchestration, workflows, and monetization stay on your backend; full Gemini capabilities |

---

## What never goes to the server (by default)

- Full PDF / DOCX binaries for storage
- Complete embedding tables
- Entire chat history tied to raw documents (unless user opts in)

## What may go to the server (per request)

- User question text
- Top-K chunk text
- Session/orchestration metadata
- Tool results from web search (transient)
