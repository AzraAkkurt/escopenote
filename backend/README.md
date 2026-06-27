# Escopenote Backend (Brain API)

Sunucu tarafı AI katmanı: Gemini orchestration, kullanım muhasebesi (uygulama kredileri) ve Escopenote desktop istemcisine HTTP/SSE sözleşmesi.

## Dokümantasyon

Tüm fazlar, API sözleşmesi ve Escopenote entegrasyon planı:

**[backend/docs/README.md](./docs/README.md)**

## Kod (hedef repo düzeni)

| Yol | Durum | Açıklama |
|-----|--------|----------|
| `apps/gateway/server.mjs` | Mevcut | Geliştirme mock’u (legacy) |
| `apps/brain/` | **B1 başladı** | Brain API — `npm run dev`, Gemini veya mock |
| `packages/contracts/` | **B0** | Paylaşımlı API tipleri |
| `infra/compose/` | **B1** | Docker Compose |
| `packages/contracts/` | Planlı | OpenAPI + paylaşımlı TS tipleri |
| `infra/compose/` | Planlı | Postgres, Redis, Traefik |

## İlişkili dokümanlar

- Platform vizyonu: [docs/backend/](../docs/backend/) (mimari, teknoloji yığını)
- İstemci tipleri (bugün): `apps/desktop/shared/gateway-types.ts`
- Veri akışı: [docs/architecture/data-flow.md](../docs/architecture/data-flow.md)
