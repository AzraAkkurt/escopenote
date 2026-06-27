# Teknoloji Yığını

Bileşen bazlı öneriler, alternatifler ve Escopenote ile hizalama. “Hepsini kur” değil — **faz bazlı minimum** mantığı.

---

## Özet tablo (hedef durum)

| Bileşen | Birincil öneri | Alternatif | İlk fazda |
|---------|----------------|------------|-----------|
| Edge / TLS | Traefik | Nginx | Traefik veya dev’de yok |
| API runtime | **FastAPI** (Python) veya **NestJS** (TS) | Hono, Go fiber | Mevcut gateway → aynı dilde brain |
| Workflow (uzun) | Custom + Redis state | LangGraph, Temporal | Custom |
| Event bus | Redis Streams | NATS | Redis only |
| Cache / session | Redis | — | Redis |
| Primary DB | PostgreSQL | — | Postgres |
| Vector (tenant) | Qdrant | Weaviate, pgvector | **Yok** (Escopenote istemci) |
| Stream to client | SSE | WebSocket | SSE (mevcut) |
| LLM | Gemini API | OpenAI, Claude | Gemini |
| Embeddings (sunucu) | — | bge-small on CPU | İstemci (Transformers.js) |
| Observability | OpenTelemetry + Grafana | Langfuse (LLM özel) | OTel + basit dashboard |
| LLM tracing | Langfuse veya Helicone | — | Langfuse cloud/self-host |
| Container | Docker Compose | K8s | Compose |
| CI | GitHub Actions | — | lint, test, image build |

---

## Aşama 1 — Tek güçlü node (3–6 ay)

### Donanım

```txt
16–32 vCPU
64–128 GB RAM
NVMe SSD
1 Gbit
```

GPU **gerekmez** (Gemini bulutta). GPU, local embedding/rerank/OCR eklendiğinde düşünülür.

Sağlayıcı: Hetzner / OVH / Leaseweb (yüksek iç trafik, düşük maliyet).

### Compose servisleri

```txt
traefik
brain-api
postgres
redis
# qdrant     → tenant memory açılınca
# langfuse   → production trace
prometheus
grafana
```

---

## Brain runtime dili seçimi

### FastAPI (Python)

**Artı:** async, SSE, LangGraph/LangChain ekosistemi, hızlı prototip.  
**Eksi:** Escopenote monorepo’su TS/Electron; iki dil operasyonu.

### NestJS (TypeScript)

**Artı:** `apps/gateway` ile birleşik repo, paylaşılan tipler (`packages/contracts`).  
**Eksi:** agent kütüphaneleri Python kadar olgun değil; orchestration çoğunlukla sizin kodunuz.

**Pratik öneri:** Gateway’i NestJS/Fastify ile büyütün; ağır ML işi yoksa **TypeScript modular monolith**. LangGraph şart olursa ince bir **Python worker** (sadece orchestration subgraph) eklenebilir.

---

## Orchestration

| Dönem | Yaklaşım |
|-------|----------|
| Faz 0–1 | `Run` tablosu + Redis lock + adım state machine |
| Faz 2 | LangGraph (Python worker) veya TS state machine genişletme |
| Faz 3+ | Temporal (dayanıklı, uzun iş, insan onayı) |

Kriter: iş 30 sn üstü, iptal/devam, insan onayı → Temporal’a geç.

---

## Veri katmanı

### PostgreSQL

- `tenants`, `api_keys`, `runs`, `run_steps`, `tool_invocations`
- `workflows`, `agent_definitions` (faz 2+)
- Faturalandırma metrikleri (faz 4)

### Redis

- Oturum: `session:{id}`
- Run lock / idempotency
- Pub/sub: stream fanout (küçük ölçek)
- Rate limit sayaçları

### Qdrant (opsiyonel)

Yalnızca **sunucu tarafı tenant knowledge** veya **platform iç dokümantasyon** için. Escopenote kullanıcı dosyaları için varsayılan **değil**.

---

## Tool execution

| execution_type | Teknoloji |
|----------------|-----------|
| `http` | Güvenli outbound client, allowlist domain |
| `mcp` | MCP SDK, stdio/SSE transport |
| `internal` | Aynı process fonksiyon |
| `docker` | Docker socket (faz 3+, kısıtlı) |
| `microvm` | Firecracker (faz 5, ISV) |

İlk implementasyon: `internal` + `http` (web search API).

---

## Streaming

- **SSE:** Escopenote zaten bekliyor; proxy timeout’ları Traefik’te yükselt
- **Backpressure:** orchestrator token queue; istemci kopunca run iptal
- **NATS:** çoklu gateway instance olunca run event fanout

---

## Observability (şart bileşenler)

| Sinyal | Araç |
|--------|------|
| Trace | OpenTelemetry → Tempo/Jaeger |
| Metrik | Prometheus (latency, error rate, active runs) |
| LLM özel | Langfuse: prompt, completion, token, tool |
| Log | yapılandırılmış JSON, `run_id` zorunlu alan |

`arch_backend.md` listesi: hallucination tracking → faz 2’de verifier agent skoru olarak.

---

## SDK ve API yüzeyi (geliştirici)

Dil önceliği: **TypeScript** (Electron müşterileri), sonra Python.

```ts
// Seviye 1
await brain.chat({ messages, context: { chunks } });

// Seviye 2
await brain.agent({ agent: 'research', input });

// Seviye 3
await brain.workflow({ steps: [...] });

// Seviye 4–5
await brain.swarm({ agents: [...] });
await brain.deployAgent({ ... });
```

Paket: `packages/brain-sdk` — sadece HTTP; Electron main process kullanır.

---

## Escopenote istemci tarafı (referans)

Platform dokümanı olsa da örneklem uygulama şunları kullanır ([stack/recommended.md](../stack/recommended.md)):

| Bileşen | Öneri |
|---------|--------|
| Shell | Electron |
| Vector | LanceDB / Chroma / Qdrant local |
| Embedding | Transformers.js / ONNX |
| IPC | Main ↔ renderer; gateway yalnızca main |

Backend seçimleri istemciyi **zorlamaz**; sadece HTTP sözleşmesi sabit kalır.

---

## Test altyapısı

| Test | Araç / yöntem |
|------|----------------|
| Contract | OpenAPI + istemci snapshot |
| Yük | k6: 100 kullanıcı × 5 agent × 10 tool (hedef) |
| Kaos | tool timeout inject |
| Stream | uzun SSE kopma simülasyonu |
| Güvenlik | API key leak scan, payload size fuzz |

---

## Bilinçli olarak ertelenenler

- Kubernetes, KEDA
- Kafka
- Firecracker / gVisor
- Multi-region
- Kendi GPU cluster
- Sunucu tarafı full RAG (Escopenote modelinde)

Sonraki: [04-gelistirme-asamalari.md](./04-gelistirme-asamalari.md)
