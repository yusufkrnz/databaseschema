---
sidebar_position: 5
title: tool_registry
why: ["output_shape_hint, UI üretici LLM'e veri gelmeden önce kabaca ne bekleyeceğini söyler — ama nihai UI kararı gerçek veri döndükten SONRA verilir (önce sorgu, sonra UI akışı).","underlying_query_ref de handler_ref ile aynı mantık: isim, SQL'in kendisi değil — SQL'i LLM değil backend çalıştırıyor."]
---

import CopyCodeButton from '@site/src/components/CopyCodeButton';

# tool_registry

`POSTGRESQL` · Platform & Yetkilendirme

Mini/Ana LLM'in veri çekmek için çağırabileceği tool kataloğu (get_deals, get_department_costs…).

_"Neden bu şekilde tasarlandı" gerekçeleri sağdaki (mobilde başlığın altındaki) bilgi kartında._

## Alanlar

| Alan | Tip | Kısıtlar | Not |
|---|---|---|---|
| `id` | `uuid` | `PK` |  |
| `name` | `varchar(100)` | `UNIQUE` `NOT NULL` | 'get_deals', 'get_department_costs' |
| `description` | `text` |  | LLM'e: bu tool ne döner, ne zaman çağrılır |
| `input_schema` | `jsonb` |  |  |
| `output_shape_hint` | `jsonb` |  | 'kaç tablo/satır dönebilir' ipucu |
| `underlying_query_ref` | `varchar(150)` | `NOT NULL` | SQL/prosedür ismi — SQL'in kendisi değil |
| `is_active` | `boolean` |  | default true |
| `created_by` | `uuid` | `FK` `YENİ` | → users.id — genel revizyonda eklendi (audit/hesap verebilirlik) |

### İndeksler

- `name — UNIQUE`

<CopyCodeButton code={"CREATE TABLE tool_registry (\n  id uuid PRIMARY KEY,\n  name varchar(100) NOT NULL UNIQUE,           -- 'get_deals', 'get_department_costs'\n  description text,                            -- LLM'e: bu tool ne döner, ne zaman çağrılır\n  input_schema jsonb,\n  output_shape_hint jsonb,                     -- 'kaç tablo/satır dönebilir' ipucu\n  underlying_query_ref varchar(150) NOT NULL,  -- SQL/prosedür ismi — SQL'in kendisi değil\n  is_active boolean DEFAULT true,              -- default true\n  created_by uuid REFERENCES users(id)         -- → users.id — genel revizyonda eklendi (audit/hesap verebilirlik)\n);\n\nCREATE UNIQUE INDEX idx_tool_registry_1 ON tool_registry name;"} label="📋 CREATE TABLE SQL'ini Kopyala" />
