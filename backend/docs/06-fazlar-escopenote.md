# Fazlar — Backend + Escopenote Desktop

Her faz için: **backend çıktıları**, **desktop değişiklikleri**, **kabul kriterleri**, **yapılmayacaklar**.

Durum takibi: [07-durum.md](./07-durum.md)

---

## B0 — API sözleşmesi

### Backend

| Görev | Detay |
|-------|--------|
| OpenAPI | `backend/openapi/escopenote-brain-v1.yaml` |
| Contracts | `packages/contracts` — chat, planner, errors, wallet |
| Mock uyumu | `apps/gateway/server.mjs` OpenAPI’ye validate |
| Planner mock | `/v1/planner/generate` mock’a ekle (şu an eksik) |

### Escopenote desktop

| Dosya / alan | Görev |
|--------------|--------|
| `shared/gateway-types.ts` | Contracts ile senkron veya generate |
| `shared/ipc-types.ts` | Gelecek `usage` event tipi için yorum/stub |
| Dokümantasyon | Bu klasör ↔ kod review checklist |

### Kabul

- [ ] Contract test CI’da yeşil
- [ ] Mevcut chat + ajant mock ile çalışmaya devam

### Yapılmayacak

- Gerçek Gemini, Postgres

---

## B1 — Brain v1 (Gemini)

### Backend

| Görev | Detay |
|-------|--------|
| `apps/brain` | NestJS/Fastify monolith |
| Endpoints | `/health`, `/v1/chat/stream`, `/v1/planner/generate` |
| Provider | Gemini streaming SDK |
| Deploy | `infra/compose` — brain + redis (opsiyonel) |
| Gizli | `GEMINI_API_KEY` env only |

### Escopenote desktop

| Dosya | Görev |
|-------|--------|
| `main/api/gateway-client.ts` | URL ayarı; SSE parse aynı |
| `main/chat/chat-service.ts` | Değişiklik minimal |
| Ayarlar | Gateway URL varsayılan staging brain |
| `GatewayProvider` | Health check brain’e |

### Kabul

- [ ] Fixtures kapalı: gerçek cevap
- [ ] Not ajant + sohbet aynı endpoint
- [ ] Planner plan JSON şeması geçerli
- [ ] Renderer’da API key alanı **yok**

### Yapılmayacak

- Kullanıcı login, cüzdan

---

## B2 — Kimlik ve cüzdan

### Backend

| Görev | Detay |
|-------|--------|
| Auth | register / login / refresh |
| Wallet | GET wallet, usage |
| Ledger | hold/settle, idempotency |
| Chat SSE | `usage` olayı |
| Fiyat tablosu | `billing_model_prices` seed |

### Escopenote desktop

| Dosya | Görev |
|-------|--------|
| `gateway-client.ts` | `Authorization: Bearer` |
| Yeni: auth store / keychain | Token main’de |
| UI | Giriş / kayıt ekranı |
| UI | Bakiye (status bar veya ayarlar) |
| `gateway-types.ts` | `usage` stream event |
| `ChatPage`, `NoteAskAgentModal` | 402 mesajı |
| IPC | `auth.*`, `wallet.getBalance` (planlı) |

### Kabul

- [ ] İki test kullanıcısı — biri diğerinin ledger’ını göremez
- [ ] Stream sonrası bakiye düşer
- [ ] Aynı `requestId` çift ücretlendirmez

---

## B3 — Araçlar (web search)

### Backend

| Görev | Detay |
|-------|--------|
| Tool | `search_web` (Tavily / Brave / Google grounding) |
| Orchestrator | chunk yok → tool politikası |
| SSE | Gerçek `research` + `pendingWebSave` |

### Escopenote desktop

| Dosya | Görev |
|-------|--------|
| `ChatPage` | Mevcut research UI — değişiklik yok |
| `NoteAskAgentModal` | “İnternet araştırması” checkbox → prompt hint (mevcut) |
| Ayarlar | `confirmBeforeSavingWebResults` aynı |

### Kabul

- [ ] Web fallback gerçek URL/snippet
- [ ] Tool timeout → kullanıcıya anlamlı hata

---

## B4 — Escopenote üretim entegrasyonu

### Backend

| Görev | Detay |
|-------|--------|
| `feature` | `chat`, `note_agent`, `planner` metering |
| `GET /health` | `capabilities[]` |
| Staging / prod | TLS, Traefik |
| Load test | k6 50 eşzamanlı SSE |

### Escopenote desktop

| Dosya | Görev |
|-------|--------|
| `chat-service.ts` | `feature` IPC’ten |
| `NoteAskAgent` | `feature: note_agent` |
| `ChatPage` | `feature: chat` |
| `package.json` | `X-Client-Version` |
| E2E | Staging brain smoke |

### Kabul

- [ ] Linux + Windows build staging’e bağlanır
- [ ] Offline banner + gateway test butonu
- [ ] p95 ilk token < 3s (staging ölçümü)

---

## B5 — Ödeme ve kota

### Backend

| Görev | Detay |
|-------|--------|
| Stripe | webhook → `wallet_grants` |
| Kota | günlük/aylık `app_tokens` limiti |
| Admin | kullanım export |

### Escopenote desktop

| Görev | Detay |
|-------|--------|
| UI | Kredi satın al |
| UI | Limit aşımı |
| Ayarlar | Kullanım geçmişi sayfası (opsiyonel) |

### Kabul

- [ ] Test ödeme → bakiye artışı
- [ ] Kota → 429 veya 402 politikası dokümante

---

## B6 — Bulut yedekleme (ileride)

### Backend

`debit_reason: cloud_backup`, byte başına fiyat.

### Escopenote

Bulut sync özelliği geldiğinde aynı `wallet` API.

---

## Desktop veri akışı (hedef)

```txt
┌─────────────────────────────────────────┐
│ Renderer                                 │
│  ChatPage / NoteAskAgent / Planner       │
│  IPC only                                │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│ Main                                     │
│  RAG search (local)                      │
│  auth token (B2+)                        │
│  gateway-client → Brain API              │
│  chat stream → renderer                  │
└─────────────────┬───────────────────────┘
                  │ HTTPS
┌─────────────────▼───────────────────────┐
│ Brain API                                │
│  Auth · Wallet · Gemini · Tools          │
└─────────────────────────────────────────┘
```

---

## Dosya haritası (referans)

| Concern | Desktop yolu |
|---------|----------------|
| SSE client | `apps/desktop/src/main/api/gateway-client.ts` |
| RAG + chat orchestration | `apps/desktop/src/main/chat/chat-service.ts` |
| IPC sözleşme | `apps/desktop/shared/ipc-types.ts`, `gateway-types.ts` |
| Sohbet UI | `apps/desktop/src/renderer/pages/ChatPage.tsx` |
| Not ajant | `apps/desktop/src/renderer/notes/components/NoteAskAgentModal.tsx` |
| Mock | `apps/gateway/server.mjs` |

İlgili: [00-yol-haritasi.md](./00-yol-haritasi.md)
