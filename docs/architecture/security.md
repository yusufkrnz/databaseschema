---
sidebar_position: 1
title: Güvenlik & İzolasyon
---

# Güvenlik & İzolasyon

Bu sayfa yeni bir şey tanıtmıyor — şema referansına dağılmış güvenlik kararlarını tek bir yerde, "sistem baştan sona nasıl korunuyor" sorusuna cevap verecek şekilde topluyor.

## 1. Multi-tenant izolasyonu

Her tenant-scoped tabloda `tenant_id` var ve en az bir `(tenant_id, …)` composite index tanımlı — bu revizyonda özellikle RLS (Row-Level Security) için 4 alt tabloya (`board_columns`, `project_members`, `calendar_event_attendees`, `taggables`) `tenant_id` **denormalize** edildi, çünkü RLS politikaları her tabloda doğrudan bir `tenant_id` kolonu ister; parent tablo üzerinden dolaylı erişim (`board_id → boards.tenant_id`) RLS politikası yazmayı zorlaştırır.

→ Detaylar: [PostgreSQL İlişki Diyagramı](/postgres/erd)

## 2. Gölgeleme prensibi — LLM'in eline hiçbir zaman URL/SQL geçmez

Dinamik UI/fonksiyon sisteminin tamamı tek bir kurala dayanıyor: **LLM sadece katalogdaki bir isimle seçim yapar, hiçbir zaman kod/URL/SQL üretmez.**

- `ui_components.name` — LLM "BarChart" der, HTML/CSS üretmez. Gerçek component'i frontend render eder.
- `action_registry.handler_ref` — LLM "export_pdf" der, bu bir fonksiyon **ismi**, endpoint değil. Gerçek çalıştırma, kullanıcı butona tıkladığında backend dispatcher'da izin kontrolünden SONRA olur.
- `tool_registry.underlying_query_ref` — LLM'in çağırdığı tool bir SQL/prosedür **ismine** işaret eder, SQL'in kendisine değil.

Üretilen HTML fragment'i her zaman sandboxed bir `iframe` içine (`sandbox="allow-scripts"`, **`allow-same-origin` YOK**) yerleştirilir; iframe içeriği ana sayfanın DOM'una/cookie'lerine erişemez, sadece `postMessage` ile kontrollü bir kanaldan dışarıyla konuşur.

→ Katalog tabloları: [ui_components](/postgres/platform/ui-components) · [action_registry](/postgres/platform/action-registry) · [tool_registry](/postgres/platform/tool-registry)

## 3. Yetkilendirme — iki ayrı katman

İki farklı RBAC katmanı var, karıştırılmamalı:

| Katman | Tablo | Neyi kontrol eder |
|---|---|---|
| Veri erişimi | `roles_permissions` | Bir rolün bir entity_type (deal, contact…) üzerindeki CRUD/onay yetkisi |
| Katalog erişimi | `permissions` + `role_permissions` | Bir rolün hangi UI component/action/tool'u görebileceği |

`role_permissions.tenant_id` NULL ise global kural, doluysa tek bir tenant için tanımlanmış istisna — global kuralı bozmadan firma-özel override yapılabiliyor.

→ Detaylar: [permissions](/postgres/platform/permissions) · [role_permissions](/postgres/platform/role-permissions)

## 4. KVKK / kişisel veri

`contacts.do_not_contact` alanı, bir kişinin iletişime kapatılmasını DB seviyesinde işaretler — pazarlama/otomasyon akışları bu alanı sorgulamadan bir contact'a ulaşmamalı.

:::warning Henüz çözülmedi
Rate limiting (kötüye kullanım / bug'lı istemci koruması) token kotasından **ayrı** bir mekanizma olmalı — kısa pencereli, muhtemelen Redis tabanlı. Şemada henüz karşılığı yok, bkz. [Maliyet Optimizasyonu → Açık Konular](/architecture/cost-optimization#açık-konular).
:::
