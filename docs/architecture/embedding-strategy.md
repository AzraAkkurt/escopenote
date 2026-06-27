# Embedding Strategy

Where embeddings are computed affects privacy, latency, and hardware requirements.

## Option A — Local embedding (recommended)

Run a small embedding model on the user's machine.

### Example models

- `bge-small`
- `nomic-embed`
- `e5-small`
- `jina` embeddings (small variants)

### Example runtimes

- ONNX Runtime
- WebGPU
- llama.cpp
- Transformers.js

### Pros

- Raw document text **never leaves** the device for embedding
- Aligns with “local vector DB + remote reasoning” architecture

### Cons

- Client needs reasonable CPU/GPU/RAM
- Model packaging and updates are your responsibility on desktop

**Default choice for Escopenote.**

---

## Option B — Server-side embedding

Send **chunks** (not necessarily whole files) to the server for embedding; vectors are still written to the **local** database.

### Pros

- Simpler client; consistent embedding model version
- Easier to swap models centrally

### Cons

- Chunk text transits your backend — weaker privacy story than Option A
- Requires clear retention policy (do not store chunks after embed)

Use only if local performance is unacceptable or for a explicit “cloud enhance” tier.

---

## Decision matrix

| Criterion | Local (A) | Server (B) |
|-----------|-----------|------------|
| Privacy | Best | Good if no persistence |
| Offline ingest | Possible | No |
| Client complexity | Higher | Lower |
| Model updates | Ship with app | Central deploy |

---

## Implementation note

Regardless of option, **retrieval always runs locally** before any Gemini call, so the server never needs the full index—only the chunks you choose to send as context.
