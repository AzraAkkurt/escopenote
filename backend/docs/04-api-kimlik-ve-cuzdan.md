# API — Kimlik ve Cüzdan (Uygulama Kredileri)

**Hedef:** Tek ortak **Gemini API key** (sunucu); her **kullanıcı** için maliyet izlenebilir; kullanıcıya **Escopenote kredisi** gösterilir.

Google AI Studio konsolu son kullanıcı bazında ayırmaz — **ledger sizde** olmalıdır.

---

## Kavramlar

| Kavram | Tanım |
|--------|--------|
| **Provider token** | Gemini `usageMetadata` (prompt + candidates) |
| **provider_cost_usd** | Model fiyat tablosundan hesaplanan gerçek maliyet |
| **Escopenote kredisi (app token)** | Kullanıcıya gösterilen birim; **1 USD maliyet ≈ 10 kredi** |
| **Hold** | Stream başlamadan tahmini kesinti rezervi |
| **Settle** | Stream bitince gerçek maliyete göre netleştirme |

İleride aynı cüzdan: `debit_reason: cloud_backup` — [00-yol-haritasi.md](./00-yol-haritasi.md) B6.

---

## Dönüşüm formülü

```text
provider_cost_usd =
  (input_tokens  × price_per_1M_input  +
   output_tokens × price_per_1M_output) / 1_000_000

app_tokens_charged = ceil(provider_cost_usd × 10 × margin_multiplier)
```

| Parametre | Başlangıç | Not |
|-----------|-----------|-----|
| `margin_multiplier` | `1.0` | Tam 1 USD = 10 kredi |
| Minimum charge | `1` kredi | Çok kısa istekler |
| Hold tahmini | `max(5, estimated_app_tokens)` | Stream öncesi |

Fiyat tablosu: `billing_model_prices` tablosu (model adı, $/1M) — [05-veri-modeli.md](./05-veri-modeli.md).

---

## Kimlik (B2)

### `POST /v1/auth/register`

```json
{
  "email": "user@example.com",
  "password": "…",
  "device_id": "optional-stable-id"
}
```

→ `{ "access_token", "refresh_token", "expires_in", "user_id" }`

### `POST /v1/auth/login`

```json
{ "email": "…", "password": "…" }
```

### `POST /v1/auth/refresh`

```json
{ "refresh_token": "…" }
```

**Desktop (B4):** Token güvenli depoda (OS keychain / şifreli dosya); renderer’a sızmaz.

---

## Cüzdan

### `GET /v1/wallet`

```json
{
  "user_id": "usr_…",
  "balance_app_tokens": 120,
  "currency_display": "Escopenote Credits",
  "usd_equivalent_hint": "12 USD equivalent at 10 credits per USD cost",
  "period_usage": {
    "from": "2026-05-01",
    "to": "2026-05-23",
    "app_tokens_spent": 45,
    "provider_cost_usd": 4.52
  }
}
```

### `GET /v1/usage?from=&to=&feature=`

```json
{
  "items": [
    {
      "request_id": "…",
      "feature": "chat",
      "app_tokens_charged": 3,
      "provider_cost_usd": 0.28,
      "model": "gemini-2.0-flash",
      "input_tokens": 1200,
      "output_tokens": 400,
      "created_at": "2026-05-23T12:00:00Z"
    }
  ]
}
```

Admin / destek: kullanıcı başına maliyet raporu bu tablodan.

---

## Faturalandırma akışı

```txt
POST /v1/chat/stream
  → Auth OK
  → wallet.balance >= hold_estimate ?  (yoksa 402)
  → INSERT usage_ledger (status: held)
  → SSE stream …
  → Gemini usageMetadata
  → UPDATE ledger (status: settled, app_tokens_charged, …)
  → SSE usage event + done
```

**Idempotency:** Aynı `X-Request-Id` ikinci kez gelirse ikinci ledger yazılmaz; önceki sonuç döner.

---

## HTTP 402

```json
{
  "error": {
    "code": "INSUFFICIENT_CREDITS",
    "message": "Yetersiz Escopenote kredisi.",
    "retryable": false,
    "details": { "balance": 0, "required_estimate": 5 }
  }
}
```

Desktop: bakiye uyarısı + (B5) yükleme sayfasına yönlendirme.

---

## Yeni kullanıcı kredisi (ürün kararı)

| Politika | Örnek |
|----------|--------|
| Hoş geldin | 100 kredi (= ~10 USD maliyet hakkı) |
| Günlük ücretsiz | 5 kredi/gün |

Uygulama: `wallet_grants` tablosu.

---

## Güvenlik

- Gemini key **asla** istemcide.
- Rate limit: kullanıcı + IP (Redis).
- Audit: `user_id`, `feature`, `request_id`, model, token sayıları.

İlgili: [05-veri-modeli.md](./05-veri-modeli.md), [06-fazlar-escopenote.md](./06-fazlar-escopenote.md)
