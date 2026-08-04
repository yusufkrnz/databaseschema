---
sidebar_position: 10
title: llm_model_routing
why: ["Engellenen edge case — model değişikliğinin deploy gerektirmesi: model seçimi koda gömülü olsaydı, daha ucuz/hızlı bir modele geçiş için kod değişikliği + deploy gerekirdi. Burada tek satır UPDATE yeterli.","fallback_model_id olmadan birincil model hata verdiğinde (timeout, rate limit) istek tamamen başarısız olurdu — otomatik ikinci bir modele düşme imkânı burada tanımlı.","model_id artık models.id'ye FK — ham Bedrock string'ine değil (bkz. models tablosu gerekçesi)."]
---

import CopyCodeButton from '@site/src/components/CopyCodeButton';

# llm_model_routing

`POSTGRESQL` · Platform & Yetkilendirme

Hangi adımda (niyet tespiti / UI üretimi / tool call) hangi modelin kullanılacağını belirleyen yönlendirme tablosu.

_"Neden bu şekilde tasarlandı" gerekçeleri sağdaki (mobilde başlığın altındaki) bilgi kartında._

## Alanlar

| Alan | Tip | Kısıtlar | Not |
|---|---|---|---|
| `id` | `uuid` | `PK` |  |
| `purpose` | `varchar(50)` | `UNIQUE` `NOT NULL` | intent_detection / ui_generation / tool_call |
| `model_id` | `uuid` | `FK` `NOT NULL` | → models.id — önceden ham Bedrock string'iydi, düzeltildi |
| `fallback_model_id` | `uuid` | `FK` | → models.id, birincil model hata verirse kullanılacak model |
| `is_active` | `boolean` |  | default true |
| `updated_at` | `timestamptz` |  | default now() |
| `created_by` | `uuid` | `FK` `YENİ` | → users.id — genel revizyonda eklendi (audit/hesap verebilirlik) |
| `updated_by` | `uuid` | `FK` `YENİ` | → users.id — genel revizyonda eklendi |

### İndeksler

- `purpose — UNIQUE`

<CopyCodeButton code={"CREATE TABLE llm_model_routing (\n  id uuid PRIMARY KEY,\n  purpose varchar(50) NOT NULL UNIQUE,           -- intent_detection / ui_generation / tool_call\n  model_id uuid NOT NULL REFERENCES models(id),  -- → models.id — önceden ham Bedrock string'iydi, düzeltildi\n  fallback_model_id uuid REFERENCES models(id),  -- → models.id, birincil model hata verirse kullanılacak model\n  is_active boolean DEFAULT true,                -- default true\n  updated_at timestamptz DEFAULT now(),          -- default now()\n  created_by uuid REFERENCES users(id),          -- → users.id — genel revizyonda eklendi (audit/hesap verebilirlik)\n  updated_by uuid REFERENCES users(id)           -- → users.id — genel revizyonda eklendi\n);\n\nCREATE UNIQUE INDEX idx_llm_model_routing_1 ON llm_model_routing purpose;"} label="📋 CREATE TABLE SQL'ini Kopyala" />
