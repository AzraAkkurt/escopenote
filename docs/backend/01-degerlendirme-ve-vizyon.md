# Değerlendirme ve Vizyon

Bu belge, [arch_backend.md](../notes/arch_backend.md) içindeki “General-purpose AI Application Runtime” vizyonunu Escopenote bağlamında değerlendirir: ne doğru, ne erken, ne eksik.

---

## Temel tez (katılıyorum)

Dokümandaki ana ayrım doğru:

| Yanlış çerçeve | Doğru çerçeve |
|----------------|---------------|
| CRUD + LLM proxy | Dağıtık AI işletim sistemi |
| `POST /chat` = ürün | Orchestration + state + tools + memory = ürün |
| Provider’a kilitlenme | Capability tabanlı provider router |

Escopenote zaten bu yönde: [architecture/overview.md](../architecture/overview.md) “server-side orchestration + client-side private vector storage” diyor. Bu, platform vizyonuyla **uyumlu bir ilk ürün postürü** — gizlilik hikayesi + sunucuda zeka.

Örneklem uygulama (`apps/desktop` + `apps/gateway/server.mjs`) şu an sadece gateway sözleşmesini doğruluyor; platform henüz yok. Bu bilinçli ve doğru bir sıra.

---

## Stratejik soru: Platform mu, ürün mü?

> “Developer bizim sistemle kendi AI SaaS’ını kurabilmeli mi?”

| Cevap | Sonuç |
|-------|--------|
| **Hayır** (sadece kendi uygulamalarınız) | Brain Orchestrator yine gerekli; SDK/tenant/plugin ikinci planda |
| **Evet** (3. parti geliştirici) | Sandbox, billing, rate limit, plugin registry **erken tasarımda** düşünülmeli; implementasyon geç kalabilir |

**Öneri:** Vizyonu **platform** olarak yazın, implementasyonu **tek tenant + internal API** ile başlayın. Escopenote = tenant 0. Böylece “Vercel for AI Agents” hedefiyle çelişmezsiniz; erken günlerde multi-tenant karmaşasından kaçınırsınız.

---

## Dokümandaki güçlü noktalar

### 1. Brain Orchestrator merkezde

Uzun süren, duraklayan, tool çağıran işler HTTP request-response ile çözülmez. **Temporal** veya **LangGraph** vurgusu yerinde. İlk fazda basit state machine + Redis/NATS yeter; workflow engine’i “Phase 2+” olarak planlamak mantıklı.

### 2. Tool execution ayrı katman

LLM gücünün çoğu tool’da. Unified Tool Registry + izolasyon + timeout + gözlemlenebilirlik — bunlar olmadan platform üretime çıkmaz.

### 3. Memory çok katmanlı

Sadece vector DB yetmez: episodic / semantic / workflow / tool state ayrımı doğru. Escopenote’ta semantic memory **istemcide** (LanceDB vb.); sunucuda workflow ve oturum hafızası öncelikli.

### 4. Provider abstraction

`if (provider === "gemini")` yerine `brain.generate({ capability: "deep_reasoning" })` — uzun vadede maliyet, latency, failover için şart.

### 5. Modular monolith + tek güçlü node

Erken Kubernetes / microservice tuzağından kaçınma tavsiyesi **doğru**. Ölçekten önce orchestration doğruluğu.

### 6. Observability erken

Langfuse / OpenTelemetry / token ve tool logları — “sonra ekleriz” denmemeli; ilk gerçek Gemini entegrasyonuyla birlikte gelmeli.

---

## Dikkat edilmesi gerekenler / düzeltmeler

### 1. Escopenote gizlilik modeli ile platform hafızası

`arch_backend.md` sunucuda Qdrant + zengin memory öneriyor. Escopenote için **varsayılan**:

- Kullanıcı korpusu ve embedding **cihazda**
- Sunucuya **transient chunk** ([data-flow.md](../architecture/data-flow.md))

Platform belleği sunucuda büyürse ürün hikayesi değişir. Çözüm: **memory scope** kavramı:

- `tenant_memory` (platform)
- `user_session_memory` (kısa ömürlü, sunucu)
- `client_private_memory` (istemci; sunucu sadece referans veya hiç)

Platform dokümantasyonunda her memory tipi için **konum ve TTL** açık yazılmalı.

### 2. NestJS vs FastAPI

İkisi de uygun. Ekip Node/Electron ağırlıklıysa **TypeScript monorepo** (gateway + brain + SDK) tutarlılık sağlar. Python ekosistem araçları (LangGraph, birçok ML aracı) için **brain worker Python**, edge **Node** hibriti de yaygın. Tek dil tercih edin; iki dil = operasyon maliyeti.

### 3. NATS + Redis + Kafka üçlüsü

Hepsini birden kurmayın. **İlk faz:** Redis (cache, pub/sub, stream) + isteğe bağlı NATS (agent bus büyüyünce). Kafka, günlük 10k+ aktif agent veya çok tenant olmadan gereksiz.

### 4. Firecracker / gVisor sandbox

3. parti kod çalıştırma yoksa **Phase 0–2’de Docker-in-Docker bile şart değil**. Önce tool’ları sizin kontrol ettiğiniz allowlist (HTTP, MCP, web search) ile sınırlayın.

### 5. “Vercel + Cloudflare + Zapier + LangGraph Cloud” karışımı

Pazar konumlandırması net; teknik olarak **tek ürün, dört persona**:

| Persona | API yüzeyi |
|---------|------------|
| Uygulama geliştirici (sizin gibi) | `brain.chat`, RAG context injection |
| Agent builder | `brain.agent`, tools |
| Otomasyon | `brain.workflow` |
| Platform / ISV | `brain.deployAgent`, custom runtime |

Hepsini aynı anda ship etmeyin; [04-gelistirme-asamalari.md](./04-gelistirme-asamalari.md) sırasını izleyin.

---

## Mimari prensipler (sabit kurallar)

1. **Context over data** — sunucu tam dosya/vektör depolamaz (Escopenote varsayılanı).
2. **Stateful orchestration** — workflow run ID, checkpoint, cancel, resume.
3. **Fail closed on tools** — timeout, invalid JSON, izin ihlali → kontrollü hata, sonsuz agent döngüsü yok.
4. **Provider behind capability** — model adı API’de ikincil.
5. **Everything traced** — run → agent → tool → token; kullanıcıya değil, operatöre.
6. **Modular monolith first** — servis sınırları kodda net, deploy tek.

---

## Özet görüş

`arch_backend.md` yönü **doğru ve iddialı**. Escopenote bu vizyonun **dar, somut, gizlilik odaklı** kanıtı olmalı; platform ise aynı gateway sözleşmesini genelleştirip agent/tool/workflow katmanlarını ekleyerek büyümeli.

En büyük risk: faz 0’da dağıtık sistem + tam platform SDK’sı kurmaya çalışmak.  
En büyük fırsat: Escopenote’ta zaten çalışan **streaming chat + planner + local RAG → gateway** hattını Brain Orchestrator’un ilk gerçek workload’u yapmak.

Sonraki belgeler: nasıl kurgulanacağı ([02](./02-mimari-kurgu.md)), hangi teknolojiler ([03](./03-teknoloji-yigini.md)), hangi sırayla ([04](./04-gelistirme-asamalari.md)).
