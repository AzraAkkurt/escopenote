# Mimari Kurgu

Platformun nasıl bölünmesi, modüller arası sözleşmeler ve Escopenote ile uyum.

---

## Üst seviye diyagram

```txt
                    [ Edge: Traefik / Nginx ]
                              |
                    API Gateway (HTTP + SSE/WS)
                              |
        +---------------------+---------------------+
        |                     |                     |
     Auth              Projects/Tenants        Realtime fanout
        |                     |                     |
        +---------------------+---------------------+
                              |
                   Brain Orchestrator  ←── çekirdek ürün
                              |
        +----------+----------+----------+----------+
        |          |          |          |          |
    Memory    Agent Runtime  Tools   Retrieval  Reasoning
        |          |          |          |          |
        +----------+----------+----------+----------+
                              |
                    Provider Router
                              |
              Gemini · OpenAI · Claude · (local)
```

Escopenote bugün sadece **Gateway** katmanının mock’unu çalıştırıyor (`apps/gateway/server.mjs`: `/v1/planner/generate`, `/v1/chat/stream`).

---

## Modular monolith iç yapısı

Tek deploy (`brain-api`), kodda net paketler:

```txt
apps/brain/
  api/              # HTTP routes, auth middleware, DTO validation
  orchestrator/     # Run lifecycle, planning, checkpoints
  agents/           # Agent definitions, routing, A2A messages
  tools/            # Registry, execution, permissions
  memory/           # Session, workflow, optional server semantic
  retrieval/        # Hybrid search (sunucu tarafı; istemci chunk kabulü)
  providers/        # Capability router, adapters
  streaming/        # SSE/WS emit, backpressure
  observability/    # OTel, metrics, audit log
  sdk/              # (ileride) public types + client
```

**Kural:** Paketler arası sadece public interface; veritabanı tablolarına çapraz erişim yok.

---

## Katman sorumlulukları

### API Gateway

| Görev | Detay |
|-------|--------|
| Kimlik | API key / JWT / (ileride) OAuth |
| Sözleşme | Versiyonlu REST (`/v1/...`) + SSE |
| Limit | Rate limit, payload boyutu, chunk sayısı üst sınırı |
| Yönlendirme | Brain’e delege; iş mantığı yok |

Escopenote uyumu: `relevant_chunks` alanı gateway şemasında kalıcı olmalı.

### Brain Orchestrator

| Görev | Detay |
|-------|--------|
| Run | `run_id`, durum: `pending → running → tool → completed/failed` |
| Planlama | Tek adım (chat) veya çok adım (workflow) |
| Context assembly | Sistem prompt + kullanıcı + chunks + tool sonuçları |
| Streaming | Token ve ara olayları (`delta`, `tool_start`, `done`) |
| Retry / fallback | Provider ve tool için politika |

**Escopenote workload’ları:**

- `planner.generate` — kısa, senkron-benzeri, düşük tool
- `chat.stream` — uzun SSE, opsiyonel web tool

### Agent Runtime

Agent = yapılandırılmış birim:

```json
{
  "id": "research-agent",
  "model_policy": { "capability": "fast_completion" },
  "tools": ["search_web"],
  "memory_scopes": ["session"],
  "max_steps": 12
}
```

İlk fazda **tek implicit agent** (chat) yeter. Faz 2’de planner için ayrı agent, faz 3’te çoklu agent.

### Tool Execution Layer

```txt
LLM tool_call
    → Tool Registry (şema + izin)
    → Executor (http | mcp | internal)
    → Sonuç normalize
    → Orchestrator’a geri
```

Escopenote için ilk tool: `search_web` (web fallback). İkinci: `summarize_for_index` (istemciye yazılacak özet üret).

### Memory System

| Tip | Konum (Escopenote) | Konum (genel platform) |
|-----|--------------------|-------------------------|
| Semantic / RAG | İstemci vector DB | İsteğe bağlı tenant Qdrant |
| Session | Sunucu Redis, TTL | Redis |
| Workflow checkpoint | Postgres | Postgres |
| Episodic (konuşma özeti) | Kısmen istemci | Postgres + özet embedding |

**Blackboard (çok agent):** Ortak `run_context` JSON — NATS veya Redis stream ile publish; paralel agent’ler aynı run’a yazar.

### Retrieval (sunucu)

Escopenote’ta retrieval **istemcide**. Sunucu katmanı:

- İstemciden gelen `relevant_chunks` doğrulama ve truncation
- (Opsiyonel) sunucu tarafı rerank — sadece enterprise / opt-in

Hybrid pipeline (platform genel):

```txt
query → BM25 + vector (tenant index) → reranker → context budget → LLM
```

### Provider Router

```ts
// Hedef API yüzeyi (konsept)
await brain.generate({
  capability: 'deep_reasoning',
  messages,
  tools,
  stream: true,
});
```

Router girdileri: maliyet, latency SLO, context limit, bölge, failover sırası.

### Developer Platform (geç faz)

Custom agent, workflow DSL, webhook, billing meter — ayrı `control-plane` modülü; runtime’dan ayrılmış API.

---

## İletişim kalıpları

### Senkron kısa iş

`POST /v1/planner/generate` → orchestrator tek shot → JSON plan.

### Uzun iş + stream

`POST /v1/chat/stream` → `text/event-stream`:

```json
{ "type": "delta", "delta": "..." }
{ "type": "tool_start", "tool": "search_web" }
{ "type": "done", "content": "...", "citations": [], "sourceType": "local|web" }
```

### İleride: WebSocket

Aynı olay şeması; çift yönlü “cancel run”, “human in the loop” için.

### Agent-to-agent (ileride)

```json
{
  "type": "TASK_RESULT",
  "run_id": "...",
  "from": "research-agent",
  "to": "writer-agent",
  "payload": {}
}
```

NATS subject: `runs.{run_id}.agents` veya Redis stream.

---

## Güvenlik ve izolasyon

| Seviye | Ne zaman |
|--------|----------|
| Allowlist HTTP tools | Faz 0–1 |
| MCP sunucuları (sizin host ettiğiniz) | Faz 2 |
| Kullanıcı tanımlı Docker tool | Faz 4+ |
| Firecracker microVM | Çok tenant + arbitrary code |

API anahtarları yalnızca gateway’de; Gemini anahtarı asla istemciye inmez (Escopenote Phase 9 ile uyumlu).

---

## Dağıtık geçiş (Aşama 2)

Ölçek tetikleyicileri ([arch_backend.md](../notes/arch_backend.md)):

- Günlük aktif agent run > ~10k
- Çok tenant enterprise
- WebSocket fanout CPU tavanı

```txt
Gateway nodes (stateless)
Worker nodes (orchestrator + agents)
Tool runner pool (izole)
Realtime nodes (WS/SSE)
Vector cluster (opsiyonel tenant memory)
Temporal cluster (uzun workflow)
```

Kubernetes + KEDA bu noktada mantıklı; öncesinde **Docker Compose tek node**.

---

## Escopenote ile sözleşme stabilitesi

Gateway path’leri değişmeden içeride orchestrator büyümeli:

| Endpoint | Şimdiki mock | Hedef iç yapı |
|----------|--------------|---------------|
| `GET /health` | ok | aynı + dependency check |
| `POST /v1/planner/generate` | local algorithm | planner agent + Gemini |
| `POST /v1/chat/stream` | token split mock | RAG-aware chat agent + optional web tool |

İstemci (`gateway-client.ts`) bu yüzden ince kalmalı; tüm zeka sunucuda.

---

## Anti-pattern’ler

- Her agent için ayrı microservice (faz 0)
- Sunucuda kullanıcı PDF arşivi “kolaylık için”
- Streaming olmadan uzun chat
- Tool sonucunu doğrulamadan tekrar LLM’e gönderme
- Gözlemlenebilirlik olmadan production Gemini

Sonraki: [03-teknoloji-yigini.md](./03-teknoloji-yigini.md)
