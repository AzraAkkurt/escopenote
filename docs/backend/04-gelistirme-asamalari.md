# Geliştirme Aşamaları

Nereden nereye: Escopenote örneklem uygulamasından tam platforma. Her fazın **çıktısı**, **teknolojileri** ve **kabul kriterleri**.

> **Uygulama odaklı faz planı** (OpenAPI → Brain API → desktop görevleri): [backend/docs/](../../backend/docs/README.md) — kod B0–B6 ile hizalıdır.

---

## Genel zaman çizelgesi

```txt
Faz 0  Escopenote bitir (referans)     ← şu an (~%80 frontend)
Faz 1  Gerçek Brain v1 (monolith)      ← 2–3 ay
Faz 2  Agent + Tool + Workflow         ← 2–4 ay
Faz 3  Geliştirici API + çok agent     ← 3–6 ay
Faz 4  Multi-tenant + sandbox         ← 6+ ay
Faz 5  Dağıtık ölçek                   ← metrik tetiklemeli
```

---

## Faz 0 — Referans uygulama (Escopenote)

**Amaç:** Platforma geçmeden önce sözleşmeyi ve UX’i doğrulamak.

### Kapsam

- Electron: planner, chat, library, local RAG ([frontend phases](../frontend/phases/))
- Mock gateway → gerçek gateway URL (Phase 9)
- Gizlilik: chunk-only upload

### Teknolojiler

- Mevcut: Electron, Vite, local vector, `apps/gateway/server.mjs` mock
- Eklenecek: production gateway stub veya Faz 1 brain’e bağlantı

### Kabul kriterleri

- [ ] Ingest → soru → SSE cevap + citation
- [ ] Planner gerçek profile’dan plan (mock veya Gemini)
- [ ] API key renderer’da yok
- [ ] Offline banner, gateway test butonu

### Platforma aktarım

Bu fazın çıktısı **ürün değil, spesifikasyon**:

- OpenAPI: `/v1/chat/stream`, `/v1/planner/generate`
- Olay şeması: `delta`, `done`, `sourceType`, `citations`, `pendingWebSave`

---

## Faz 1 — Brain v1 (Modular Monolith)

**Amaç:** Mock gateway’i gerçek orchestrator ile değiştirmek; hâlâ tek tenant (siz).

### Mimari

```txt
Docker Compose
  → brain-api (NestJS veya FastAPI)
  → Postgres (runs, logs)
  → Redis (session, rate limit)
  → Traefik (TLS, routing)
```

### Özellikler

1. **Provider router** — yalnızca Gemini, capability: `chat`, `plan`
2. **Chat stream** — gerçek Gemini streaming + istemci `relevant_chunks`
3. **Planner** — structured output (JSON plan schema)
4. **Observability** — Langfuse veya OTel ile token/tool log
5. **Auth** — API key header; tek org

### Teknolojiler

- Postgres, Redis, Gemini API, SSE
- Langfuse (önerilir)
- GitHub Actions: test + deploy image

### Kabul kriterleri

- [ ] Escopenote mock’suz aynı endpoint’lerle çalışır
- [ ] p95 chat ilk token < 3s (ölçüm kayıtlı)
- [ ] Runaway token limiti (max output / run)
- [ ] Provider hata → kullanıcı dostu hata kodu

### Yapılmayacaklar

- Multi-tenant, billing, custom agent, sandbox

---

## Faz 2 — Agent Runtime + Tool Layer

**Amaç:** `brain.chat` arkasında yapılandırılabilir agent; web fallback gerçek tool.

### Özellikler

- Tool registry: `search_web`, `format_citations`
- Agent tanımları (DB): chat-agent, planner-agent
- Tool timeout, retry, structured error
- Web fallback: tool → `pendingWebSave` metadata (Escopenote UI)
- Basit workflow: planner → (opsiyonel) task önerileri tek run

### Teknolojiler

- Redis Streams veya NATS (tool/async olaylar)
- Web search API (Tavily, Brave, vb.)
- Postgres: `tool_invocations`

### Kabul kriterleri

- [ ] Tool failure sonrası run failed veya graceful degrade
- [ ] 100 paralel chat run stabil (tek node)
- [ ] Agent recursion limiti çalışıyor
- [ ] Langfuse’da tool span görünür

### Test (arch_backend checklist)

- Concurrent agent chains
- Tool chaos (timeout, invalid JSON)
- Streaming 5+ dk session

---

## Faz 3 — Memory + Retrieval + Reasoning

**Amaç:** Platform hafızası; istemci RAG ile birlikte veya opt-in sunucu RAG.

### Özellikler

- Session memory özeti (Redis + Postgres)
- Hybrid retrieval **tenant opt-in** için
- Reasoning subgraph: planner için plan → verify (opsiyonel)
- Context budget optimizer (chunk truncation, rerank)

### Teknolojiler

- Qdrant (sadece opt-in tenant index)
- Reranker model (CPU, küçük cross-encoder) — GPU opsiyonel
- BM25: Postgres full-text veya Meilisearch

### Kabul kriterleri

- [ ] Escopenote modu: hâlâ sadece chunk upload, sunucuda vektör yok
- [ ] Enterprise modu: tenant doküman upload politikası dokümante
- [ ] Memory corruption testi: paralel run’lar izole

---

## Faz 4 — Developer Platform

**Amaç:** 3. parti geliştirici kendi agent/workflow’unu tanımlasın.

### Özellikler

- Public API + API key yönetimi
- `brain.agent`, `brain.workflow` HTTP
- Webhook’lar, rate limit, kullanım metrikleri
- MCP tool kaydı (hosted)
- Docker tool (kısıtlı, allowlist image)

### Teknolojiler

- Stripe veya benzeri (billing)
- Docker-in-docker veya ayrı tool-runner VM
- Kontrol paneli (ayrı web app)

### Kabul kriterleri

- [ ] Harici geliştirici 1 günde custom agent deploy (dokümantasyon ile)
- [ ] Tenant A, tenant B verisi izole
- [ ] Sandbox escape testleri geçti

---

## Faz 5 — Dağıtık ölçek

**Tetikleyici:** günlük aktif agent > ~10k veya WS fanout CPU tavanı.

### Mimari

- Stateless gateway × N
- Worker pool (orchestrator)
- Temporal cluster
- NATS cluster
- K8s + KEDA

### Teknolojiler

- Kubernetes, distributed NATS, Temporal cloud/self-host

---

## API olgunluk seviyeleri (arch_backend ile hizalı)

| Seviye | API | Faz |
|--------|-----|-----|
| 1 | `brain.chat()` | 1 |
| 2 | `brain.agent({ tools })` | 2 |
| 3 | `brain.workflow()` | 2–3 |
| 4 | `brain.swarm()` | 3–4 |
| 5 | `brain.deployAgent()` | 4–5 |

---

## Repo organizasyonu önerisi

```txt
escopenote/                    # monorepo (mevcut)
  apps/
    desktop/                   # referans istemci
    gateway/                   # → apps/brain veya merge
    brain/                     # yeni: orchestrator API
  packages/
    contracts/                 # OpenAPI tipleri, event şemaları
    brain-sdk/                 # TS client
  infra/
    compose/                   # postgres, redis, traefik
  docs/
    backend/                   # bu klasör
```

`apps/gateway/server.mjs` → Faz 1’de `apps/brain` içine taşınır; path’ler sabit kalır.

---

## Riskler ve önlemler

| Risk | Önlem |
|------|--------|
| Erken microservice | Modular monolith zorunlu Faz 1–3 |
| Sunucuda veri birikimi | Varsayılan chunk-only; tenant flag |
| Token patlaması | run budget, model max_tokens |
| WebSocket karmaşıklığı | SSE first; WS ihtiyaç olunca |
| İki dil karmaşası | Tek ana dil; Python sadece gerekirse worker |

---

## İlk 30 gün aksiyon listesi (Faz 1 başlangıcı)

1. `packages/contracts` — gateway request/response tipleri (desktop ile paylaşımlı)
2. `apps/brain` iskelet — health, planner, chat stream
3. Gemini adapter + Langfuse trace
4. Docker Compose local dev
5. Escopenote Settings’te gateway URL → yeni brain
6. Yük testi script (k6) — 50 eşzamanlı stream

Sonraki: [05-escopenote-referans-uygulama.md](./05-escopenote-referans-uygulama.md)
