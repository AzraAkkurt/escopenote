# Yol Haritası — API’den Escopenote’a

Bu belge, backend geliştirmesinin **bağımlılık sırasını** ve her fazın **çıktısını** tanımlar. Uygulama görevleri için [06-fazlar-escopenote.md](./06-fazlar-escopenote.md), canlı durum için [07-durum.md](./07-durum.md).

---

## Üst seviye akış

```txt
B0  Sözleşme (OpenAPI + contracts)     ← mock ile birebir
 │
 ▼
B1  Brain API + Gemini               ← apps/brain, Docker
 │
 ▼
B2  Auth + wallet + usage_ledger     ← kullanıcı başına maliyet
 │
 ▼
B3  Tools (web search, …)            ← research / pendingWebSave gerçek
 │
 ▼
B4  Escopenote entegrasyonu          ← JWT, bakiye, feature alanları
 │
 ▼
B5  Ödeme / kota                     ← kullandığın kadar öde
 │
 ▼
B6  Bulut yedekleme kredisi          ← aynı cüzdan, farklı debit_reason
```

**Kural:** Bir sonraki faza geçmeden önce önceki fazın **kabul kriterleri** tamamlanır; API yolu (`/v1/...`) geriye dönük uyumlu kalır.

---

## Faz özeti

### B0 — API sözleşmesi (2–3 hafta)

| | |
|---|---|
| **Amaç** | Mock (`apps/gateway/server.mjs`) ile production hedefinin tek kaynağı |
| **Çıktılar** | OpenAPI 3.1, `packages/contracts`, hata kodu tablosu |
| **Escopenote** | `gateway-types.ts` → contracts’tan türetim veya çift yazım bitene kadar senkron |
| **Kabul** | Contract test: mock yanıtları OpenAPI’ye uygun |

→ [01-api-genel.md](./01-api-genel.md) … [04-api-kimlik-ve-cuzdan.md](./04-api-kimlik-ve-cuzdan.md)

---

### B1 — Brain v1 / gerçek Gemini (3–5 hafta)

| | |
|---|---|
| **Amaç** | Mock’u aynı endpoint’lerle değiştirmek |
| **Çıktılar** | `apps/brain`, `GET /health`, `POST /v1/chat/stream`, `POST /v1/planner/generate` |
| **Escopenote** | Ayarlarda gateway URL → brain; davranış değişmez (fixtures kapalı) |
| **Kabul** | Escopenote chat + ajant mock’suz çalışır; Langfuse’da run görünür |

Tek org API key (sunucu env); henüz kullanıcı cüzdanı zorunlu değil.

---

### B2 — Kimlik ve cüzdan (2–4 hafta)

| | |
|---|---|
| **Amaç** | Ortak Gemini key + **kullanıcı başına** maliyet ve kredi |
| **Çıktılar** | `POST /v1/auth/*`, `GET /v1/wallet`, `usage_ledger`, hold/settle |
| **Escopenote** | Giriş ekranı; `Authorization` header; bakiye göstergesi |
| **Kabul** | Her `done` sonrası ledger satırı; 402 yetersiz bakiye |

Kredi: **1 USD provider maliyeti = 10 Escopenote kredisi** (detay [04-api-kimlik-ve-cuzdan.md](./04-api-kimlik-ve-cuzdan.md)).

---

### B3 — Araç katmanı (3–4 hafta)

| | |
|---|---|
| **Amaç** | Web araştırması ve planner’ı tool ile beslemek |
| **Çıktılar** | `search_web` tool, gerçek `research` SSE, `pendingWebSave` |
| **Escopenote** | Mevcut UI (research paneli, web kaydet) değişmeden çalışır |
| **Kabul** | Chunk yokken web fallback; tool hata → graceful degrade |

---

### B4 — Escopenote üretim entegrasyonu (2–3 hafta)

| | |
|---|---|
| **Amaç** | Desktop’u production brain’e “ürün” olarak bağlamak |
| **Çıktılar** | `feature` alanı, idempotency, sürüm header’ları, E2E test |
| **Escopenote** | `gateway-client`: auth + `feature`; not ajant `note_agent`; chat `chat` |
| **Kabul** | Linux/Windows paket build + staging brain URL ile smoke test |

---

### B5 — Ödeme ve kota (4+ hafta)

| | |
|---|---|
| **Amaç** | Kullandığın kadar öde, günlük/aylık limit |
| **Çıktılar** | Stripe webhook, paket krediler, admin rapor |
| **Escopenote** | Satın alma UI, limit aşımı mesajları |
| **Kabul** | Test ödeme → bakiye artar; limit → 429/402 politikası net |

---

### B6 — Bulut tüketimi (ileride)

| | |
|---|---|
| **Amaç** | Yedekleme / sync için aynı cüzdan |
| **Çıktılar** | `debit_reason: cloud_backup`, byte veya GB fiyatı |
| **Escopenote** | Ayarlar → bulut yedekleme (henüz yok) |

---

## Platform fazları ile eşleme

| `backend/docs` | `docs/backend/04-gelistirme-asamalari.md` |
|----------------|-------------------------------------------|
| B0 | Faz 0 çıktısı (spesifikasyon) |
| B1 | Faz 1 — Brain v1 |
| B2–B3 | Faz 1–2 (auth + tools) |
| B4 | Escopenote referans tamamlama |
| B5–B6 | Faz 4+ (billing, platform) |

---

## Kritik mimari kararlar (değişmez)

1. **Gemini API key** yalnızca sunucuda (`GEMINI_API_KEY`).
2. **Ham dosya** varsayılan olarak sunucuya gitmez; yalnızca `relevant_chunks[]`.
3. **İstemci ↔ API** transport: **SSE** (`text/event-stream`), WebSocket sonra ihtiyaç olursa.
4. **Desktop:** renderer Gemini’ye gitmez; main process `gateway-client.ts`.
5. **Idempotency:** `X-Request-Id` + `request_id` (IPC) aynı run’ı iki kez faturalandırmaz.

---

## Repo hedefi

```txt
escopenote/
  backend/docs/          ← bu klasör (plan + sözleşme)
  apps/
    desktop/             ← Escopenote (ilk tüketici)
    gateway/             ← mock (CI / offline dev)
    brain/               ← B1+
  packages/
    contracts/           ← B0
  infra/compose/         ← B1
```

Sonraki adım: [01-api-genel.md](./01-api-genel.md)
