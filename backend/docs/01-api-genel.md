# API — Genel Kurallar

**Sürüm:** `v1` (URL öneki)  
**Temel URL:** `https://api.escopenote.example` (ortam değişkeni)  
**Geliştirme mock:** `http://127.0.0.1:3000` (`apps/gateway/server.mjs`)

---

## İlkeler

| İlke | Uygulama |
|------|----------|
| Geriye uyumluluk | Yeni alanlar opsiyonel; alan silme = `v2` |
| Gizlilik | Varsayılan: chunk metni, dosya yolu istemcide kalır |
| Streaming | Uzun işler SSE; JSON tek parça yalnızca health / wallet |
| Faturalandırma | Her faturalı işlem `X-Request-Id` ile izlenir (B2+) |

---

## Ortak başlıklar

| Başlık | Zorunlu | Açıklama |
|--------|---------|----------|
| `Authorization` | B2+ | `Bearer <access_token>` |
| `Content-Type` | POST | `application/json` |
| `Accept` | GET/POST | `application/json` veya `text/event-stream` |
| `X-Request-Id` | Önerilir | UUID; idempotent run (B2+) |
| `X-Client-Version` | Önerilir | Örn. `desktop/1.0.0` |
| `X-Client-Platform` | Önerilir | `linux` \| `win32` |
| `Accept-Language` | Opsiyonel | `tr`, `en` — sistem prompt dili |

B0–B1 (tek org): `Authorization: Bearer <ESCOPENOTE_SERVICE_KEY>` yeterli olabilir; B2’de kullanıcı JWT’ye geçilir.

---

## Endpoint listesi (hedef)

| Metot | Yol | Faz | Açıklama |
|-------|-----|-----|----------|
| GET | `/health` | B0 | Sağlık |
| POST | `/v1/chat/stream` | B0 | SSE sohbet |
| POST | `/v1/planner/generate` | B0 | Çalışma planı JSON |
| POST | `/v1/auth/register` | B2 | Hesap / cihaz |
| POST | `/v1/auth/login` | B2 | Token |
| POST | `/v1/auth/refresh` | B2 | Yenileme |
| GET | `/v1/wallet` | B2 | Bakiye + özet |
| GET | `/v1/usage` | B2 | Kullanım geçmişi |

---

## HTTP hata gövdesi

Tüm JSON hatalar (SSE dışı):

```json
{
  "error": {
    "code": "INSUFFICIENT_CREDITS",
    "message": "Human-readable message",
    "retryable": false,
    "details": {}
  }
}
```

### Kodlar (sunucu → istemci eşlemesi)

| HTTP | `code` | Desktop `RequestErrorCode` | `retryable` |
|------|--------|----------------------------|-------------|
| 401 | `UNAUTHORIZED` | `GATEWAY_UNAUTHORIZED` | false |
| 402 | `INSUFFICIENT_CREDITS` | `GATEWAY_ERROR` * | false |
| 403 | `FORBIDDEN` | `GATEWAY_UNAUTHORIZED` | false |
| 429 | `RATE_LIMITED` | `GATEWAY_RATE_LIMIT` | true |
| 408 / 504 | `TIMEOUT` | `GATEWAY_TIMEOUT` | true |
| 502 / 503 | `PROVIDER_UNAVAILABLE` | `GATEWAY_UNAVAILABLE` | true |
| 500 | `INTERNAL_ERROR` | `GATEWAY_ERROR` | true |

\* B4’te desktop’a özel `INSUFFICIENT_CREDITS` eklenebilir.

SSE akışı içi hata: `{ "type": "error", "error": { "code", "message", "retryable" } }` — [02-api-chat-stream.md](./02-api-chat-stream.md).

---

## Boyut ve limitler (önerilen)

| Limit | Değer |
|-------|--------|
| `message` max uzunluk | 32 000 karakter |
| `relevant_chunks` max adet | 24 |
| Chunk `text` max | 8 000 karakter / chunk |
| SSE run max süre | 120 s (chat), 60 s (planner) |
| Max output tokens (Gemini) | Politika ile (ör. 8192) |

Aşımda: `400` + `VALIDATION_ERROR`.

---

## Sürümleme

- URL: `/v1/...` sabit kalır.
- `GET /health` gövdesi:

```json
{
  "ok": true,
  "version": "1.2.0",
  "api": "v1",
  "capabilities": ["chat.stream", "planner.generate", "wallet"]
}
```

`capabilities` — istemci özellik bayrağı (B4).

---

## OpenAPI

B0 çıktısı: `backend/openapi/escopenote-brain-v1.yaml` (planlı).  
Kaynak tipler bugün: `apps/desktop/shared/gateway-types.ts` → `packages/contracts` taşınacak.

İlgili: [02-api-chat-stream.md](./02-api-chat-stream.md), [04-api-kimlik-ve-cuzdan.md](./04-api-kimlik-ve-cuzdan.md)
