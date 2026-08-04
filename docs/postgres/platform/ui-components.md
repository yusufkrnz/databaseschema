---
sidebar_position: 3
title: ui_components
why: ["prop_schema, LLM'in ürettiği JSON'u backend'e ulaşmadan önce doğrulamak için var — component ismi doğru ama prop'lar şemaya uymuyorsa istek reddedilir.","LLM'e kod değil sadece katalogdaki bir isim seçtirmek, güvenlik sınırını burada çiziyor (önceki oturumdaki 'gölgeleme' prensibi)."]
---

import CopyCodeButton from '@site/src/components/CopyCodeButton';

# ui_components

`POSTGRESQL` · Platform & Yetkilendirme

Dinamik UI'ın seçebileceği görsel component kataloğu (Table, BarChart, KPICard, ComparisonView…). LLM'e asla kod/HTML ürettirmiyoruz — sadece bu kataloğun içinden isimle seçim yaptırıyoruz.

_"Neden bu şekilde tasarlandı" gerekçeleri sağdaki (mobilde başlığın altındaki) bilgi kartında._

## Alanlar

| Alan | Tip | Kısıtlar | Not |
|---|---|---|---|
| `id` | `uuid` | `PK` |  |
| `name` | `varchar(100)` | `UNIQUE` `NOT NULL` | 'Table', 'BarChart', 'KPICard'… |
| `category` | `varchar(50)` |  | data-display / chart / comparison / action |
| `prop_schema` | `jsonb` | `NOT NULL` | LLM çıktısının prop'larını doğrulayan JSON Schema |
| `description` | `text` |  | LLM sistem promptunda 'ne zaman kullanılır' açıklaması |
| `is_active` | `boolean` |  | default true |
| `created_by` | `uuid` | `FK` `YENİ` | → users.id — genel revizyonda eklendi (audit/hesap verebilirlik) |
| `created_at` | `timestamptz` |  | default now() |

### İndeksler

- `name — UNIQUE`

<CopyCodeButton code={"CREATE TABLE ui_components (\n  id uuid PRIMARY KEY,\n  name varchar(100) NOT NULL UNIQUE,     -- 'Table', 'BarChart', 'KPICard'…\n  category varchar(50),                  -- data-display / chart / comparison / action\n  prop_schema jsonb NOT NULL,            -- LLM çıktısının prop'larını doğrulayan JSON Schema\n  description text,                      -- LLM sistem promptunda 'ne zaman kullanılır' açıklaması\n  is_active boolean DEFAULT true,        -- default true\n  created_by uuid REFERENCES users(id),  -- → users.id — genel revizyonda eklendi (audit/hesap verebilirlik)\n  created_at timestamptz DEFAULT now()   -- default now()\n);\n\nCREATE UNIQUE INDEX idx_ui_components_1 ON ui_components name;"} label="📋 CREATE TABLE SQL'ini Kopyala" />
