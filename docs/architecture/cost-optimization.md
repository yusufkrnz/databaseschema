---
sidebar_position: 2
title: Maliyet Optimizasyonu
---

# Maliyet Optimizasyonu

AWS Bedrock üzerinden çalışan mini/ana LLM çağrıları gerçek para — bu sayfa, "bir tenant'ın token'ı biterse ne olur, maliyeti nasıl doğru hesaplıyoruz" sorularının cevabını topluyor.

## 1. Pre-flight gate — LLM'e gitmeden ÖNCE kontrol

İstek geldiğinde, mini LLM'e (niyet tespiti) gitmeden önce **deterministik, LLM içermeyen** bir kontrol var: `tenant_token_usage`'daki `reserved_tokens + actual_tokens`, `quota_limit`'i aşıyor mu? Aşıyorsa istek LLM'e hiç gitmeden "token bitti, paket yükseltin/ek token alın" cevabı döner — bu adımın maliyeti sıfır, çünkü hiçbir model çağrılmıyor.

## 2. Rezervasyon — race condition'a karşı

LLM cevabı gelmeden gerçek token sayısı bilinmiyor (sadece tahmini input var, output bilinmiyor). Bu yüzden pre-flight gate'te **tahmini miktar önce rezerve edilir** (`reserved_tokens`), cevap gelince **gerçek sayıyla düzeltilir** (`actual_tokens`). Rezervasyon olmadan, kotasının sınırında olan bir tenant'ın attığı eşzamanlı istekler hepsi ayrı ayrı "yeterli" görüp geçer ve toplamda kota fena aşılır.

→ Detaylar: [tenant_token_usage](/postgres/platform/tenant-token-usage)

## 3. Fiyatın donması (frozen cost)

Bedrock model fiyatları değişebilir. `model_pricing` fiyatı **effective_date'li** tutar; her `llm_call_log` kaydı, çağrı anındaki fiyatla hesaplanan `cost_usd`'yi kendi içine **donmuş** olarak yazar. Sonradan fiyat değişse bile geçmiş ayın maliyet raporu yeniden hesaplanmış gibi görünmez — bu, tenant'a doğru/tutarlı fatura kesebilmenin ön koşulu.

→ Detaylar: [model_pricing](/postgres/platform/model-pricing) · [llm_call_log](/mongodb/llm-call-log)

## 4. Model orkestrasyonu

Hangi adımda (niyet tespiti / UI üretimi / tool call) hangi Bedrock modelinin kullanılacağı `llm_model_routing`'de tanımlı — koda gömülü değil, deploy gerektirmeden değiştirilebilir. Birincil model hata verirse `fallback_model_id`'ye düşülür ve bu durum (`was_fallback`) loglanır — aksi halde "bu ay neden daha pahalı" sorusuna cevap veremezdik.

→ Detaylar: [llm_model_routing](/postgres/platform/llm-model-routing)

## 5. Ortak havuz, dönemsel kota

Kota **tenant** (firma) seviyesinde ortak bir havuz — departman/rol bazında bölünmüyor (MVP kararı). `tenant_token_usage.period` ("YYYY-MM") ve `quota_limit`'in dönem bazlı satırda tutulması, ay ortası plan yükseltmelerinde geçmiş dönemlerin kotasının geriye dönük değişmemesini garanti ediyor.

## Açık Konular

:::warning Henüz çözülmedi
- **Rate limiting ≠ token kotası.** Kısa pencereli kötüye kullanım koruması (örn. dakikada N istek) token kotasından ayrı bir mekanizma olmalı, muhtemelen Redis'te — şemada henüz karşılığı yok.
- **Departman bazlı üst sınır.** `tenant_token_usage.department_id` nullable bırakıldı, MVP'de kullanılmıyor ama bir departmanın tüm firma kotasını tek başına tüketmesi riski var — ihtiyaç netleşince şema değişikliği gerekmeden açılabilir.
- **Soft limit / hard limit ayrımı.** %100'de sert kesmek yerine %80'de uyarı (mevcut `notifications` tablosuna satır ekleyerek) tetiklenmesi tasarlandı ama henüz otomatikleştirilmedi.
:::
