# Backend — Dokümantasyon İndeksi

Bu klasör, **API sözleşmesinden** başlayıp **Escopenote desktop entegrasyonuna** kadar uzanan fazlaşmış geliştirme planının tek kaynağıdır (`backend/docs`).

Üst düzey platform kararları için: [docs/backend/](../../docs/backend/) (mimari, teknoloji, uzun vadeli Faz 1–5).

---

## Okuma sırası

| # | Dosya | Ne zaman okunur |
|---|--------|------------------|
| 0 | [00-yol-haritasi.md](./00-yol-haritasi.md) | Önce — tüm fazların özeti ve bağımlılıklar |
| 1 | [01-api-genel.md](./01-api-genel.md) | URL, sürüm, kimlik, hatalar |
| 2 | [02-api-chat-stream.md](./02-api-chat-stream.md) | Sohbet + not içi ajant SSE |
| 3 | [03-api-planner.md](./03-api-planner.md) | Çalışma planı üretimi |
| 4 | [04-api-kimlik-ve-cuzdan.md](./04-api-kimlik-ve-cuzdan.md) | Kullanıcı, kredi (1 USD = 10 token) |
| 5 | [05-veri-modeli.md](./05-veri-modeli.md) | Postgres şeması |
| 6 | [06-fazlar-escopenote.md](./06-fazlar-escopenote.md) | Faz bazlı backend + desktop görevleri |
| 7 | [07-durum.md](./07-durum.md) | Canlı ilerleme / checklist |
| — | [../openapi/escopenote-brain-v1.yaml](../openapi/escopenote-brain-v1.yaml) | OpenAPI 3.1 (B0) |

---

## Faz kodları (bu doküman seti)

Platform dokümanındaki “Faz 1–5” ile karışmaması için burada **B0–B6** kullanılır:

| Kod | Ad | Özet |
|-----|-----|------|
| **B0** | Sözleşme dondurma | OpenAPI + `packages/contracts`; mock ile uyum |
| **B1** | Brain v1 | Gerçek Gemini, auth, SSE aynı şema |
| **B2** | Cüzdan ve metering | Kullanıcı başına maliyet, uygulama kredisi |
| **B3** | Araçlar | Web search, `pendingWebSave` gerçek |
| **B4** | Escopenote prod bağlantısı | JWT, bakiye UI, hata kodları |
| **B5** | Ödeme ve kota | Stripe, limitler |
| **B6** | Bulut tüketimi | Yedekleme aynı cüzdandan (ileride) |

Detay: [00-yol-haritasi.md](./00-yol-haritasi.md), uygulama görevleri: [06-fazlar-escopenote.md](./06-fazlar-escopenote.md).

---

## Tek cümle

> Gemini anahtarı yalnızca sunucuda; desktop chunk gönderir, SSE alır; maliyet sunucuda ölçülür ve kullanıcıya **Escopenote kredisi** (10 kredi ≈ 1 USD maliyet) olarak yansıtılır.
