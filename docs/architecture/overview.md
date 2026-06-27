# Architecture Overview

## Model name

**Server-side AI orchestration + client-side private vector storage**

This matches how many modern AI desktop products handle privacy: intelligence in the cloud, secrets at the edge.

## High-level diagram

```txt
User PC
--------------------------------
Local Vector DB
Embeddings
Files & private data
--------------------------------
        |
   secure sync / query
        |
Your Backend
--------------------------------
Gemini Orchestrator
Agents · Tools · Workflows
--------------------------------
        |
    Gemini API
```

## Advanced pattern (optional)

Split responsibilities between a **local agent** and a **cloud brain**:

| Layer | Responsibilities |
|-------|------------------|
| **Local AI runtime** | Retrieval, indexing, embeddings, permissions, local tools |
| **Cloud AI gateway** | Gemini, orchestration, multi-step workflows, reasoning |

Recommended end-to-end path:

```txt
Desktop UI
    → Local AI runtime
    → Local vector DB
    → Relevant context only
    → Your AI gateway
    → Gemini
```

## Hybrid RAG

```txt
Local Retrieval  +  Remote Reasoning
```

Retrieval and storage are local; synthesis and tool use are remote. This is the default enterprise-friendly pattern for Escopenote.

## Security posture on the server

- Do **not** persist user corpora or vector DBs centrally
- Accept only **transient** context payloads per request
- Orchestrate Gemini calls, agents, and tools in one controlled gateway

This supports privacy marketing and reduces breach impact.

## Critical design rule

> **Do not move data — move context.**

The server must not receive full PDFs, full embedding stores, or complete user profiles unless explicitly required for a feature (e.g. optional server-side embedding — see [embedding strategy](./embedding-strategy.md)).

What crosses the wire looks like:

```json
{
  "relevant_chunks": [
    "...",
    "...",
    "..."
  ]
}
```

See [data flow](./data-flow.md) for step-by-step behavior.
