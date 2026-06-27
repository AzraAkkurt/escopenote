# Durum ve Checklist

**Son güncelleme:** 2026-05-24  
Bu dosya geliştirme ilerledikçe güncellenir.

---

## Özet

| Faz | Durum | Not |
|-----|--------|-----|
| B0 Sözleşme | 🟡 | `packages/contracts` + OpenAPI yaml |
| B1 Brain v1 | 🟡 | Gemini chat + planner; desktop `feature`/locale |
| B2 Cüzdan | 🟡 | Postgres + auth + wallet + SSE usage; desktop Hesap UI |
| B3 Araçlar | 🔲 | |
| B4 Escopenote prod | 🟡 | Brain varsayılan; ayar migrasyonu 3000→3001 |
| B5 Ödeme | 🔲 | |
| B6 Bulut | 🔲 | |

Durum simgeleri: ✅ tamam · 🟡 devam · 🔲 bekliyor

---

## Escopenote desktop (mevcut)

| Özellik | Gateway | Not |
|---------|---------|-----|
| Sohbet (RAG) | Brain + Gemini | `feature: chat`, locale ayarlardan |
| Ajanta sor | Brain + Gemini | `feature: note_agent` |
| Planner | Brain API | Gemini veya mock fallback |
| API key istemcide | ✅ Yok | Doğru model |
| Auth / bakiye UI | 🟡 | Ayarlar → Hesap ve kredi (B2) |

---

## B0 checklist

- [x] `backend/openapi/escopenote-brain-v1.yaml`
- [x] `packages/contracts` paketi
- [x] Mock planner endpoint (`apps/gateway/server.mjs`)
- [ ] CI: spectral veya openapi-diff

---

## B1 checklist

- [x] `apps/brain` iskelet (Fastify)
- [x] Gemini chat stream (`GEMINI_API_KEY` ile)
- [x] Planner endpoint (Gemini JSON + mock fallback)
- [x] Docker Compose (`infra/compose`)
- [x] Escopenote `npm run dev` → `dev:brain`; varsayılan URL `http://127.0.0.1:3001`

---

## B2 checklist

- [x] Postgres migrasyon (`001_b2_auth_wallet.sql`, port **5433**)
- [x] Auth endpoints (`/v1/auth/*`, JWT)
- [x] Wallet + ledger (hold / settle / fail)
- [x] SSE `usage` event
- [x] Desktop login + balance (`AccountSettingsSection`)
- [ ] Planner endpoint billing
- [ ] NoteAskAgent `usage` / 402 handling

---

## Karar logu

| Tarih | Karar |
|-------|--------|
| 2026-05-23 | Faz kodları B0–B6; API önce, desktop fazları [06](./06-fazlar-escopenote.md) |
| 2026-05-23 | 1 USD provider maliyeti = 10 Escopenote kredisi |
| 2026-05-23 | Ana API dili: TypeScript (`apps/brain`), SSE korunur |
| 2026-05-24 | `apps/brain` + `packages/contracts` + Docker Compose eklendi |
| 2026-05-24 | B2: Postgres auth/wallet, JWT, SSE usage, desktop Hesap UI |

---

## Sonraki aksiyon (önerilen sıra)

1. B2 smoke: Postgres 5433 → brain dev → desktop kayıt → sohbet → bakiye düşüşü
2. B3: araçlar (tools)
3. B5: ödeme / kredi satın alma

Changelog buraya kısa madde olarak eklenir.
