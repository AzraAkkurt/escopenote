# API — Planner (`POST /v1/planner/generate`)

Çalışma planı üretimi: kısa istek, yapılandırılmış JSON yanıt (SSE değil).

**Durum:** Desktop’ta planner UI mevcut; gateway mock’ta `/v1/planner/generate` dokümante ([docs/backend/05-escopenote-referans-uygulama.md](../../docs/backend/05-escopenote-referans-uygulama.md)). Mock `server.mjs` şu an yalnızca chat endpoint’ini expose ediyor — B0’da planner mock’a eklenecek veya brain’de ilk gün implement edilecek.

---

## İstek

```http
POST /v1/planner/generate HTTP/1.1
Authorization: Bearer <token>
Content-Type: application/json
X-Request-Id: <uuid>
```

```json
{
  "profile": {
    "subjects": [
      { "id": "s1", "name": "Matematik", "difficulty": "hard" }
    ],
    "hoursPerDay": 4,
    "hoursPerWeek": 20,
    "busyWeek": false
  },
  "scope": "day",
  "anchorDate": "2026-05-23",
  "locale": "tr"
}
```

| Alan | Açıklama |
|------|----------|
| `scope` | `day` \| `week` |
| `anchorDate` | ISO tarih `YYYY-MM-DD` |
| `profile` | Kullanıcı çalışma profili (yerel ayarlardan) |

**Not:** Planner için `relevant_chunks` gönderilmez (RAG gerekmez).

---

## Yanıt (JSON, 200)

```json
{
  "plan": {
    "id": "plan_abc123",
    "scope": "day",
    "anchorDate": "2026-05-23",
    "blocks": [
      {
        "id": "blk_1",
        "subjectId": "s1",
        "subjectName": "Matematik",
        "title": "Matematik — Session 1",
        "startTime": "09:00",
        "durationMinutes": 60,
        "date": "2026-05-23"
      }
    ],
    "generatedAt": "2026-05-23T10:00:00.000Z"
  },
  "usage": {
    "provider_cost_usd": 0.001,
    "app_tokens_charged": 1,
    "balance_remaining": 99
  }
}
```

`usage` B2+; B1’de yalnızca log.

### Hata

Standart JSON hata gövdesi — [01-api-genel.md](./01-api-genel.md).

---

## Sunucu implementasyonu

| Faz | Yaklaşım |
|-----|----------|
| B1 | Gemini structured output (JSON schema) veya mock algoritma parity |
| B2 | Aynı + ledger |
| B3 | Opsiyonel: profil + geçmiş oturum özeti |

---

## Desktop entegrasyonu

| Bileşen | Görev |
|---------|--------|
| `gateway-client.ts` | `generatePlan(body)` (eklenecek) |
| Planner sayfası | Profile JSON gönder, plan render |
| IPC | `planner.generate` kanalı (planlı) |

**feature** metering: `planner` (düşük maliyetli capability).

---

## Kabul kriterleri

- [ ] Aynı profile + tarih → şema geçerli plan (mock veya Gemini)
- [ ] p95 yanıt < 15 s
- [ ] Escopenote task board’a blok aktarımı bozulmaz

İlgili: [02-api-chat-stream.md](./02-api-chat-stream.md), [06-fazlar-escopenote.md](./06-fazlar-escopenote.md)
