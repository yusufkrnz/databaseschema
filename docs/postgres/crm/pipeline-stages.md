---
sidebar_position: 4
title: pipeline_stages
---

import CopyCodeButton from '@site/src/components/CopyCodeButton';

# pipeline_stages

`POSTGRESQL` · CRM

Satış hunisinin (pipeline) aşamaları; order_index sıralamayı belirler.

## Alanlar

| Alan | Tip | Kısıtlar | Not |
|---|---|---|---|
| `id` | `uuid` | `PK` |  |
| `tenant_id` | `uuid` | `FK` `NOT NULL` | → tenants.id |
| `name` | `varchar(100)` | `NOT NULL` |  |
| `order_index` | `int` | `NOT NULL` |  |
| `is_won` | `boolean` |  | default false |
| `is_lost` | `boolean` |  | default false |
| `color` | `varchar(20)` |  |  |
| `created_by` | `uuid` | `FK` `YENİ` | → users.id — genel revizyonda eklendi (audit/hesap verebilirlik) |
| `created_at` | `timestamptz` | `YENİ` | eksikti — eklendi |

### İndeksler

- `(tenant_id, order_index)`
- `(tenant_id, name) — UNIQUE`

<CopyCodeButton code={"CREATE TABLE pipeline_stages (\n  id uuid PRIMARY KEY,\n  tenant_id uuid NOT NULL REFERENCES tenants(id),  -- → tenants.id\n  name varchar(100) NOT NULL,\n  order_index int NOT NULL,\n  is_won boolean DEFAULT false,                    -- default false\n  is_lost boolean DEFAULT false,                   -- default false\n  color varchar(20),\n  created_by uuid REFERENCES users(id),            -- → users.id — genel revizyonda eklendi (audit/hesap verebilirlik)\n  created_at timestamptz                           -- eksikti — eklendi\n);\n\nCREATE INDEX idx_pipeline_stages_1 ON pipeline_stages (tenant_id, order_index);\nCREATE UNIQUE INDEX idx_pipeline_stages_2 ON pipeline_stages (tenant_id, name);"} label="📋 CREATE TABLE SQL'ini Kopyala" />
