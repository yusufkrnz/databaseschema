---
sidebar_position: 4
title: action_registry
why: ["handler_ref bir URL/endpoint değil sadece bir isim — gerçek execution backend dispatcher'da, permission kontrolünden SONRA gerçekleşiyor. LLM'in eline hiçbir zaman çalıştırılabilir bir adres geçmiyor.","risk_level=high olan aksiyonlar dispatch anında ekstra onay ister — LLM'in 'öneri' yetkisi execution yetkisiyle karışmıyor."]
---

import CopyCodeButton from '@site/src/components/CopyCodeButton';

# action_registry

`POSTGRESQL` · Platform & Yetkilendirme

Kullanıcıya önerilebilecek buton/aksiyon kataloğu (create_task, export_pdf, send_reminder…). LLM aksiyonu 'önerir', gerçek çalıştırma tıklandığında backend dispatcher'da izin kontrolünden sonra olur.

_"Neden bu şekilde tasarlandı" gerekçeleri sağdaki (mobilde başlığın altındaki) bilgi kartında._

## Alanlar

| Alan | Tip | Kısıtlar | Not |
|---|---|---|---|
| `id` | `uuid` | `PK` |  |
| `name` | `varchar(100)` | `UNIQUE` `NOT NULL` | 'create_task', 'export_pdf', 'send_reminder' |
| `label_template` | `varchar(150)` |  | Butonda gösterilecek metin şablonu |
| `handler_ref` | `varchar(150)` | `NOT NULL` | backend fonksiyon ismi — URL DEĞİL, sadece isim |
| `required_params` | `jsonb` |  |  |
| `risk_level` | `varchar(20)` |  | default 'low'; low/medium/high |
| `requires_confirm` | `boolean` |  | default false |
| `is_active` | `boolean` |  | default true |
| `created_by` | `uuid` | `FK` `YENİ` | → users.id — genel revizyonda eklendi (audit/hesap verebilirlik) |

### İndeksler

- `name — UNIQUE`

<CopyCodeButton code={"CREATE TABLE action_registry (\n  id uuid PRIMARY KEY,\n  name varchar(100) NOT NULL UNIQUE,       -- 'create_task', 'export_pdf', 'send_reminder'\n  label_template varchar(150),             -- Butonda gösterilecek metin şablonu\n  handler_ref varchar(150) NOT NULL,       -- backend fonksiyon ismi — URL DEĞİL, sadece isim\n  required_params jsonb,\n  risk_level varchar(20) DEFAULT 'low',    -- default 'low'; low/medium/high\n  requires_confirm boolean DEFAULT false,  -- default false\n  is_active boolean DEFAULT true,          -- default true\n  created_by uuid REFERENCES users(id)     -- → users.id — genel revizyonda eklendi (audit/hesap verebilirlik)\n);\n\nCREATE UNIQUE INDEX idx_action_registry_1 ON action_registry name;"} label="📋 CREATE TABLE SQL'ini Kopyala" />
