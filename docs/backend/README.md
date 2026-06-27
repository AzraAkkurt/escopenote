# Backend Platform Dokümantasyonu

Bu klasör, Escopenote örnek uygulamasının ötesinde kurulacak **asıl hizmet** (AI Application Runtime / platform) için mimari kararları, teknoloji seçimlerini ve geliştirme sırasını toplar.

> **API sözleşmesi, B0–B6 fazları ve Escopenote entegrasyon görevleri** için birincil kaynak: **[backend/docs/](../../backend/docs/README.md)** (fazlaşmış uygulama planı).

Kaynak fikirler: [notes/arch_backend.md](../notes/arch_backend.md)  
Mevcut ürün mimarisi: [architecture/overview.md](../architecture/overview.md)

## Okuma sırası

| Dosya | İçerik |
|-------|--------|
| [01-degerlendirme-ve-vizyon.md](./01-degerlendirme-ve-vizyon.md) | `arch_backend.md` değerlendirmesi, güçlü/zayıf noktalar, stratejik kararlar |
| [02-mimari-kurgu.md](./02-mimari-kurgu.md) | Katmanlar, sınırlar, modular monolith → dağıtık geçiş |
| [03-teknoloji-yigini.md](./03-teknoloji-yigini.md) | Bileşen bazlı teknoloji önerileri ve alternatifler |
| [04-gelistirme-asamalari.md](./04-gelistirme-asamalari.md) | Faz faz yol haritası, çıktılar, kabul kriterleri |
| [05-escopenote-referans-uygulama.md](./05-escopenote-referans-uygulama.md) | Örneklem uygulama ile platform arasındaki ilişki |

## Uygulama planı (API → desktop)

| Kaynak | İçerik |
|--------|--------|
| [backend/docs/](../../backend/docs/README.md) | OpenAPI hedefi, endpoint detayları, cüzdan, faz checklist |
| [backend/docs/06-fazlar-escopenote.md](../../backend/docs/06-fazlar-escopenote.md) | Her fazda backend + `apps/desktop` görevleri |

## Tek cümle özet

> Escopenote, “veriyi taşıma — bağlam taşı” ilkesini kanıtlayan referans istemci; asıl ürün ise bu bağlamı işleyen, agent/tool/workflow çalıştıran **Brain Orchestrator** platformudur.
