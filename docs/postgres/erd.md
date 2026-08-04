---
sidebar_position: 1
title: İlişki Diyagramı (ERD)
---

import OpenInDbdiagram from '@site/src/components/OpenInDbdiagram';

# PostgreSQL İlişki Diyagramı

36 tablonun tamamı, foreign key ilişkileriyle. Kolon detayları için sol menüdeki tablo sayfalarına bakın — bu diyagram sadece büyük resmi gösterir (created_by/updated_by gibi audit alanları ve polimorfik id referansları burada gösterilmiyor, sadeliği bozmasın diye).

Aşağıdaki statik diyagram yeterli değilse — tıklayın: içerik panoya kopyalanır, yeni sekmede dbdiagram.io açılır, orada yapıştırıp sürükle-bırak, filtrelenebilir, PNG/PDF export edilebilir bir ERD üzerinde inceleyebilirsiniz.

<OpenInDbdiagram />

```mermaid
erDiagram
  tenants ||--o{ departments : has
  tenants ||--o{ job_levels : has
  tenants ||--o{ roles : has
  tenants ||--o{ users : employs
  departments ||--o{ users : contains
  job_levels ||--o{ users : ranks
  roles ||--o{ users : assigned_to
  roles ||--o{ roles_permissions : grants
  tenants ||--o{ custom_field_definitions : defines
  tenants ||--o{ activities : logs
  users ||--o{ activities : creates
  tenants ||--o{ attachments : stores
  users ||--o{ attachments : uploads
  tenants ||--o{ tasks : has
  users ||--o{ tasks : assigned
  board_columns ||--o{ tasks : contains
  tenants ||--o{ tags : defines
  tags ||--o{ taggables : applied_via
  tenants ||--o{ notifications : sends
  users ||--o{ notifications : receives
  tenants ||--o{ companies : tracks
  users ||--o{ companies : owns
  companies ||--o{ contacts : has
  companies ||--o{ addresses : has
  tenants ||--o{ pipeline_stages : defines
  companies ||--o{ deals : has
  contacts ||--o{ deals : involves
  pipeline_stages ||--o{ deals : at_stage
  users ||--o{ deals : owns
  tenants ||--o{ projects : runs
  users ||--o{ projects : owns
  projects ||--o{ project_members : has
  users ||--o{ project_members : joins
  projects ||--o{ boards : has
  boards ||--o{ board_columns : has
  tenants ||--o{ calendar_events : schedules
  users ||--o{ calendar_events : creates
  calendar_events ||--o{ calendar_event_attendees : invites
  users ||--o{ calendar_event_attendees : attends
  tenants ||--o{ ai_conversations : has
  users ||--o{ ai_conversations : starts
  roles ||--o{ role_permissions : granted_via
  permissions ||--o{ role_permissions : defines
  tenants ||--o{ role_permissions : scopes
  tenants ||--o{ tenant_ui_overrides : customizes
  ui_components ||--o{ tenant_ui_overrides : overrides
  subscription_plans ||--o{ tenants : subscribes
  tenants ||--o{ tenant_token_usage : consumes
  departments ||--o{ tenant_token_usage : "sub-allocates (opsiyonel)"
  models ||--o{ llm_model_routing : routes
  models ||--o{ model_pricing : priced_as
```

:::note
`audit_log`, `ai_messages`, `ai_message_tool_calls`, `ai_message_ui_widgets` bu diyagramda yer almıyor — tamamen MongoDB'ye taşındılar. Bkz. [MongoDB](/mongodb/principles).

`permissions`, `ui_components`, `action_registry`, `tool_registry` de bu diyagramda yok — `permissions.catalog_item_id` isim değil gerçek bir id ile eşleşiyor artık, ama `catalog_type`'a göre 3 farklı tablodan birine bakabildiği için (polimorfik) tek bir sabit FK oku olarak çizilemiyor — tıpkı `activities`/`attachments`/`tasks`'teki `entity_type + entity_id` gibi. `handler_ref` (action_registry) ve `underlying_query_ref` (tool_registry) ise bilinçli olarak isim/referans kalıyor — bunlar backend fonksiyon/SQL isimleri, LLM'e hiçbir zaman gerçek bir id/URL verilmiyor (gölgeleme prensibi). Bkz. [Platform & Yetkilendirme](/postgres/platform/permissions) ve [Güvenlik & İzolasyon](/architecture/security).
:::
