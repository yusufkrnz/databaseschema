---
sidebar_position: 5
title: İlişkiler
slug: /relationships
---

import OpenInDbdiagram from '@site/src/components/OpenInDbdiagram';
import CopyRemoteFileButton from '@site/src/components/CopyRemoteFileButton';

# İlişkiler — Postgres, Mongo ve İkisi Arasında

Şemadaki ilişki bilgisi üç ayrı yere dağılmıştı: Postgres ERD, Postgres↔Mongo köprüsü ve Mongo'nun kendi iç bağları. Bu sayfa üçünü tek yerde topluyor.

## 1. PostgreSQL İçi İlişkiler

36 tablonun tamamı, foreign key ilişkileriyle. Ayrıntılı sürüm ve DBML export için [PostgreSQL İlişki Diyagramı](/postgres/erd) sayfasına bakın.

<OpenInDbdiagram />

```mermaid
erDiagram
  tenants ||--o{ departments : has
  tenants ||--o{ users : employs
  departments ||--o{ users : contains
  roles ||--o{ users : assigned_to
  tenants ||--o{ companies : tracks
  companies ||--o{ contacts : has
  companies ||--o{ deals : has
  pipeline_stages ||--o{ deals : at_stage
  tenants ||--o{ projects : runs
  projects ||--o{ boards : has
  boards ||--o{ board_columns : has
  board_columns ||--o{ tasks : contains
  tenants ||--o{ ai_conversations : has
  roles ||--o{ role_permissions : granted_via
  permissions ||--o{ role_permissions : defines
  subscription_plans ||--o{ tenants : subscribes
  tenants ||--o{ tenant_token_usage : consumes
  models ||--o{ llm_model_routing : routes
  models ||--o{ model_pricing : priced_as
```

_Tam 95 ilişkili sürüm için [İlişki Diyagramı (ERD)](/postgres/erd) sayfasına gidin._

## 2. Postgres ↔ MongoDB Köprüsü

Düz çizgi: uygulama seviyesinde referans (id eşleşmesi). Kesik çizgi: tenant/entity kimliği yazma anında Mongo belgesine kopyalanır, DB seviyesinde FK yoktur.

```mermaid
flowchart LR
  subgraph PG["PostgreSQL — kaynak gerçeklik"]
    direction TB
    T["tenants / users"]
    C["companies · contacts · deals"]
    AC["ai_conversations (thin)"]
  end

  subgraph MG["MongoDB — esnek / hızlı büyüyen"]
    direction TB
    M1["ai_conversations (metadata)"]
    M2["ai_message_buckets"]
    M3["audit_log"]
    M4["activities (alternatif)"]
    M5["custom_field_values (alternatif)"]
    M6["llm_call_log"]
  end

  AC -- "id = conversation_id, app-level" --> M1
  M1 -- "conversation_id + bucket_seq" --> M2
  T -. "tenant_id / user_id kopyalanır" .-> M3
  C -. "entity_type + entity_id" .-> M4
  C -. "entity_type + entity_id" .-> M5
  T -. "tenant_id / user_id kopyalanır" .-> M6
```

:::danger Bu köprünün sınırı
Cross-database transaction ve FK enforcement yok — detaylar için [Güvenilirlik & Tutarlılık](/architecture/reliability).
:::

## 3. MongoDB İçi İlişkiler

Mongo tarafında koleksiyonların çoğu **birbirine referans vermez** — her biri bağımsız, sadece `tenant_id` ile izole olur. Tek gerçek iç ilişki, konuşma metadata'sını mesaj bucket'larına bağlayan zincir:

```mermaid
flowchart LR
  classDef reference fill:#E7F0F5,stroke:#28688d,color:#1a4760
  classDef embed fill:#E6F4EB,stroke:#2a8355,color:#1a4d33
  classDef append fill:#FBEBD3,stroke:#c08a2e,color:#7a5418
  classDef coexist fill:#F1E9FA,stroke:#6b3fa0,color:#442868

  AC["ai_conversations\n(metadata)"]:::reference -- "conversation_id" --> AMB["ai_message_buckets\n(bucket_seq sırayla)"]:::embed

  subgraph independent[" "]
    direction TB
    AL["audit_log"]:::append
    ACT["activities"]:::coexist
    CFV["custom_field_values"]:::coexist
    LCL["llm_call_log"]:::append
  end
```

Alttaki 4 koleksiyon (`audit_log`, `activities`, `custom_field_values`, `llm_call_log`) kasıtlı olarak birbirinden bağımsız — her biri kendi `tenant_id`'siyle izole, aralarında JOIN'e benzer bir erişim deseni yok. Bu, sharding stratejisini de basitleştiriyor (bkz. [Performans & Ölçekleme](/architecture/performance)).

<CopyRemoteFileButton path="/mongo-seed.js" label="📋 Tüm Mongo Seed Script'ini Kopyala (6 koleksiyon)" />

## Nereye bakmalı

- Tek bir tablonun/koleksiyonun tüm alanları → sol menüden ilgili sayfa
- "Neden Postgres/Mongo" kararının gerekçesi → [Genel Bakış](/intro)
- Güvenlik, maliyet, performans, güvenilirlik açısından çapraz-kesen bakış → [Mimari İlkeler](/architecture/security)
