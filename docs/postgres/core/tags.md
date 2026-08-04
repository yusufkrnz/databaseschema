---
sidebar_position: 11
title: tags
---

import CopyCodeButton from '@site/src/components/CopyCodeButton';

# tags

`POSTGRESQL` · Core — Multi-tenant Çekirdek

Tenant'a özel serbest etiket tanımları.

## Alanlar

| Alan | Tip | Kısıtlar | Not |
|---|---|---|---|
| `id` | `uuid` | `PK` |  |
| `tenant_id` | `uuid` | `FK` `NOT NULL` | → tenants.id |
| `name` | `varchar(100)` | `NOT NULL` |  |
| `color` | `varchar(20)` |  |  |
| `created_by` | `uuid` | `FK` `YENİ` | → users.id — genel revizyonda eklendi (audit/hesap verebilirlik) |
| `created_at` | `timestamptz` | `YENİ` | eksikti — eklendi |
| `deleted_at` | `timestamptz` | `YENİ` | NULL = aktif; doluysa soft-delete edilmiş — genel revizyonda eklendi |

### İndeksler

- `(tenant_id, name) — UNIQUE`

<CopyCodeButton code={"CREATE TABLE tags (\n  id uuid PRIMARY KEY,\n  tenant_id uuid NOT NULL REFERENCES tenants(id),  -- → tenants.id\n  name varchar(100) NOT NULL,\n  color varchar(20),\n  created_by uuid REFERENCES users(id),            -- → users.id — genel revizyonda eklendi (audit/hesap verebilirlik)\n  created_at timestamptz,                          -- eksikti — eklendi\n  deleted_at timestamptz                           -- NULL = aktif; doluysa soft-delete edilmiş — genel revizyonda eklendi\n);\n\nCREATE UNIQUE INDEX idx_tags_1 ON tags (tenant_id, name);"} label="📋 CREATE TABLE SQL'ini Kopyala" />
