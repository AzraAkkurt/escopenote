# Escopenote Referans Uygulama

Escopenote’un “asıl hizmet” platformu ile ilişkisi ve kanıtlaması gereken davranışlar.

---

## Rol tanımı

| | Escopenote (örneklem) | Platform (asıl ürün) |
|---|----------------------|----------------------|
| **Ne** | Öğrenci odaklı desktop ürün | AI Application Runtime |
| **Kim** | Son kullanıcı | Siz + (ileride) 3. parti geliştiriciler |
| **Veri** | Dosya ve vektör cihazda | Transient context + orchestration state |
| **Değer** | UX, planner, RAG chat | Agent, tool, workflow, provider router |

Escopenote **satılabilir ürün** olabilir; platform **altyapı** olur. İkisi aynı Brain’i paylaşır.

---

## Şu anki teknik durum

### İstemci (`apps/desktop`)

- Local RAG: chunk, embed, search ([architecture/data-flow.md](../architecture/data-flow.md))
- Main process: `gateway-client.ts` → HTTP/SSE
- IPC: renderer asla doğrudan Gemini’ye gitmez

### Gateway mock (`apps/gateway/server.mjs`)

| Endpoint | Davranış |
|----------|----------|
| `GET /health` | Sağlık |
| `POST /v1/planner/generate` | Yerel algoritma ile plan |
| `POST /v1/chat/stream` | SSE; local chunk veya web mock |

Bu mock, Faz 1 Brain’in **aynı sözleşmeyle** değiştirilmesi gereken hedef arayüzdür.

---

## Platform için Escopenote’un kanıtladığı şeyler

1. **Context-over-data** — `relevant_chunks` ile çalışan chat
2. **Streaming UX** — delta + done + citations
3. **Çok modlu ürün** — planner (kısa JSON) + chat (uzun stream)
4. **Web fallback hikayesi** — `sourceType`, `pendingWebSave`
5. **Offline / gateway kopması** — banner, settings test
6. **Main-only API** — güvenlik modeli doğru

---

## Platform için Escopenote’un kanıtlamadığı şeyler

Bunlar referans uygulamada **olmak zorunda değil**; platform Faz 2+ ile gelir:

- Multi-agent / blackboard
- Custom developer agents
- Sunucu tarafı vector tenant memory
- Sandbox code execution
- Billing / multi-tenant

Bu boşluklar bilinçli; örneklem uygulamayı şişirmeyin.

---

## Veri akışı (hedef, production)

```txt
[Kullanıcı PC]
  Dosya → chunk → embed → LanceDB
  Soru → local topK
       → POST /v1/chat/stream { message, relevant_chunks }
              |
[Brain Platform]
  Orchestrator → Gemini (+ search_web tool)
       → SSE delta/done
              |
[Kullanıcı PC]
  UI render; opsiyonel web özeti → local index
```

Planner için chunk gerekmez; profile JSON gider.

---

## Gateway şema önerisi (stabil)

### Chat stream istek

```json
{
  "message": "string",
  "relevant_chunks": [
    {
      "chunkId": "string",
      "fileName": "string",
      "text": "string"
    }
  ],
  "session_id": "optional-uuid",
  "locale": "tr"
}
```

### Chat stream yanıt olayları

- `{ "type": "delta", "delta": "..." }`
- `{ "type": "done", "content": "...", "sourceType": "local|web", "citations": [], "pendingWebSave": {} }`

### Planner istek / yanıt

Mevcut desktop tipleri (`gateway-types.ts`) kaynak doğruluk; `packages/contracts`’a taşınmalı.

---

## Geçiş planı (mock → Brain v1)

| Adım | Eylem |
|------|--------|
| 1 | OpenAPI spec yaz (`docs/backend/openapi` — ileride) |
| 2 | `apps/brain` deploy; Escopenote `.env` gateway URL |
| 3 | Feature flag: mock / real gateway |
| 4 | Langfuse’ta Escopenote run’larını etiketle `tenant=escopenote` |
| 5 | Mock gateway’i deprecated; sadece CI fixture |

---

## Ürün–platform karar ağacı

```txt
Yeni özellik isteği
    |
    ├─ Sadece öğrenci UX mi?     → Escopenote desktop
    |
    ├─ Tüm müşterilerin AI’sı mı? → Brain platform
    |
    └─ İkisi de mi?
           → Önce platform API
           → Escopenote ikinci tüketici olarak bağlanır
```

Örnek: “PDF’yi sunucuda indexle” → platform (opt-in tenant); Escopenote varsayılanında **hayır**.

---

## Sonuç

Escopenote, `arch_backend.md` vizyonunun **dar, gerçekçi ilk müşterisi**. Platformu kurarken her fazda soru:

> “Escopenote mock’suz çalışmaya devam eder mi?”

Evet ise faz doğru; hayır ise faz erken veya sözleşme kırılmış demektir.

İlgili: [01-degerlendirme-ve-vizyon.md](./01-degerlendirme-ve-vizyon.md) · [04-gelistirme-asamalari.md](./04-gelistirme-asamalari.md)
