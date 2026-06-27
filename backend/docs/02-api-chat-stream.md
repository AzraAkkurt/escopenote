# API — Chat Stream (`POST /v1/chat/stream`)

Sohbet sayfası, not editörü **Ajanta sor** ve (ileride) diğer metin üretimleri bu endpoint’i kullanır.

**Transport:** `text/event-stream` (SSE)  
**Mock referans:** `apps/gateway/server.mjs` → `handleChatStream`  
**Desktop:** `apps/desktop/src/main/api/gateway-client.ts`, `chat-service.ts`

---

## İstek

```http
POST /v1/chat/stream HTTP/1.1
Host: api.escopenote.example
Authorization: Bearer <token>
Content-Type: application/json
Accept: text/event-stream
X-Request-Id: 550e8400-e29b-41d4-a716-446655440000
```

### Gövde (JSON)

```json
{
  "message": "Kullanıcının sorusu veya sunucuya giden tam prompt",
  "relevant_chunks": [
    {
      "chunkId": "chk_abc",
      "fileName": "Fizik_Notlar.pdf",
      "text": "Chunk metni (yalnızca ilgili parça)"
    }
  ],
  "session_id": "optional-uuid",
  "course_id": "optional-course-id",
  "locale": "tr",
  "feature": "chat"
}
```

| Alan | Zorunlu | Açıklama |
|------|---------|----------|
| `message` | evet | Kullanıcı metni veya B4’te sunucunun kabul ettiği birleşik prompt |
| `relevant_chunks` | hayır | İstemci RAG sonucu; boş → sunucu web/tool değerlendirir |
| `session_id` | hayır | Sunucu oturum özeti (B3+) |
| `course_id` | hayır | RAG kapsamı istemcide zaten uygulandı; audit için |
| `locale` | hayır | `tr` \| `en` |
| `feature` | B4+ | `chat` \| `note_agent` \| `workflow` — metering ayrımı |

**Snake_case** (`relevant_chunks`, `session_id`) HTTP gövdesinde; desktop IPC camelCase kalabilir, main dönüştürür.

### Desktop akışı (bugün)

```txt
Renderer  api.chat.send({ requestId, message, sessionId, courseId })
    → Main  searchRag(message, { courseId })
    → Main  POST /v1/chat/stream { message, relevant_chunks, sessionId }
    → Main  IPC CHAT_STREAM events → Renderer
```

B4: `feature` IPC’den geçirilir (`chat` vs `note_agent`).

---

## Yanıt (SSE)

Her olay: `data: <json>\n\n`

### Olay türleri

#### `delta`

```json
{ "type": "delta", "delta": "parça metin" }
```

#### `thinking` (opsiyonel)

```json
{ "type": "thinking", "delta": "Ara düşünce metni\n" }
```

#### `research` (opsiyonel, B3 gerçek tool)

```json
{
  "type": "research",
  "query": "arama ifadesi",
  "snippet": "kısa önizleme"
}
```

#### `usage` (B2+)

```json
{
  "type": "usage",
  "provider_cost_usd": 0.0023,
  "app_tokens_charged": 1,
  "balance_remaining": 49
}
```

`done` öncesi veya `done` içinde gönderilebilir; istemci bakiye günceller.

#### `done`

```json
{
  "type": "done",
  "content": "Tam yanıt metni",
  "sourceType": "local",
  "citations": [
    {
      "id": "cit_xxx",
      "chunkId": "chk_abc",
      "sourceType": "local",
      "fileName": "Fizik_Notlar.pdf",
      "excerpt": "Alıntı…"
    }
  ],
  "thinking": "opsiyonel özet",
  "pendingWebSave": {
    "title": "Web: konu başlığı",
    "summary": "Kütüphaneye kaydedilebilecek özet"
  }
}
```

| `sourceType` | Anlam |
|--------------|--------|
| `local` | Yanıt ağırlıklı olarak `relevant_chunks` |
| `web` | Web araştırması / yetersiz yerel bağlam |

`pendingWebSave`: Escopenote kullanıcı onayı ile yerel indekse yazar ([features/chat-rag.md](../../docs/features/chat-rag.md)).

#### `error`

```json
{
  "type": "error",
  "error": {
    "code": "PROVIDER_UNAVAILABLE",
    "message": "…",
    "retryable": true
  }
}
```

---

## Desktop IPC eşlemesi

Sunucu SSE → main `emitStream` → renderer `ChatStreamEvent`:

| SSE | IPC `ChatStreamEvent` |
|-----|------------------------|
| `delta` | `{ type: 'delta', requestId, delta }` |
| `thinking` | `{ type: 'thinking', requestId, delta }` |
| `research` | `{ type: 'research', requestId, query, snippet? }` |
| `usage` | B4: `{ type: 'usage', requestId, ... }` (eklenecek) |
| `done` | `{ type: 'done', requestId, result: ChatSendResult }` |
| `error` | `{ type: 'error', requestId, error }` |

`ChatSendResult`: `apps/desktop/shared/gateway-types.ts`

---

## Sunucu davranışı (hedef)

```txt
1. Auth + (B2) bakiye hold tahmini
2. relevant_chunks + message → context assembly
3. Gemini stream (usageMetadata topla)
4. Gerekirse search_web tool → research SSE
5. done + usage + ledger settle
```

Mock bugün: chunk yoksa veya mesajda "web" geçerse web dalı simüle eder.

---

## Örnek akış (yerel RAG)

```txt
→ POST { message: "Mitoz nedir?", relevant_chunks: […], feature: "chat" }
← thinking: "Found 3 relevant chunk(s)…"
← delta (birçok)
← done { sourceType: "local", citations: [...] }
← usage { app_tokens_charged: 2, balance_remaining: 98 }   # B2+
```

---

## Kabul testleri (B0 contract)

- [ ] OpenAPI şeması tüm olay türlerini listeler
- [ ] Mock sunucu örnek fixture ile validate edilir
- [ ] Chunk’sız istek 200 SSE döner (web dalı veya kısa cevap)
- [ ] `message` boş → 400

İlgili: [03-api-planner.md](./03-api-planner.md), [06-fazlar-escopenote.md](./06-fazlar-escopenote.md)
