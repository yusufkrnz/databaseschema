---
sidebar_position: 9
title: models
why: ["Engellenen edge case — sağlayıcı isim değiştirince tüm zincirin kopması: llm_model_routing, model_pricing ve llm_call_log hepsi doğrudan Bedrock'un ham string ID'sine ('anthropic.claude-sonnet-5') referans verseydi, AWS bu string'i değiştirdiğinde (versiyon güncellemesi, yeniden adlandırma) üç yerin de senkron güncellenmesi gerekirdi — biri unutulursa sessizce kopardı. Şimdi tek nokta (models.provider_model_id) güncellenir, geri kalanı kendi sabit id'mize bağlı kalır."]
---

import CopyCodeButton from '@site/src/components/CopyCodeButton';

# models

`POSTGRESQL` · Platform & Yetkilendirme

Bedrock (ve ileride başka sağlayıcıların) modellerinin kendi kataloğumuz — llm_model_routing, model_pricing ve Mongo'daki llm_call_log hep bu tablonun `id`'sine referans verir, ham sağlayıcı string'ine değil.

_"Neden bu şekilde tasarlandı" gerekçeleri sağdaki (mobilde başlığın altındaki) bilgi kartında._

## Alanlar

| Alan | Tip | Kısıtlar | Not |
|---|---|---|---|
| `id` | `uuid` | `PK` |  |
| `provider` | `varchar(50)` | `NOT NULL` | default 'bedrock' |
| `provider_model_id` | `varchar(150)` | `NOT NULL` `UNIQUE` | sağlayıcının ham string ID'si, örn. 'anthropic.claude-sonnet-5' |
| `display_name` | `varchar(150)` |  | 'Claude Sonnet 5' gibi okunaklı isim |
| `is_active` | `boolean` |  | default true |
| `created_by` | `uuid` | `FK` `YENİ` | → users.id — genel revizyonda eklendi (audit/hesap verebilirlik) |
| `created_at` | `timestamptz` |  | default now() |

### İndeksler

- `provider_model_id — UNIQUE`

<CopyCodeButton code={"CREATE TABLE models (\n  id uuid PRIMARY KEY,\n  provider varchar(50) DEFAULT 'bedrock' NOT NULL,  -- default 'bedrock'\n  provider_model_id varchar(150) NOT NULL UNIQUE,   -- sağlayıcının ham string ID'si, örn. 'anthropic.claude-sonnet-5'\n  display_name varchar(150),                        -- 'Claude Sonnet 5' gibi okunaklı isim\n  is_active boolean DEFAULT true,                   -- default true\n  created_by uuid REFERENCES users(id),             -- → users.id — genel revizyonda eklendi (audit/hesap verebilirlik)\n  created_at timestamptz DEFAULT now()              -- default now()\n);\n\nCREATE UNIQUE INDEX idx_models_1 ON models provider_model_id;"} label="📋 CREATE TABLE SQL'ini Kopyala" />
