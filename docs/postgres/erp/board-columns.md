---
sidebar_position: 4
title: board_columns
---

import CopyCodeButton from '@site/src/components/CopyCodeButton';

# board_columns

`POSTGRESQL` · ERP / İç Operasyon

Bir board'un sütunları (örn. Yapılacak / Devam Ediyor / Bitti). wip_limit ile sütun kapasitesi sınırlanabilir.

## Alanlar

| Alan | Tip | Kısıtlar | Not |
|---|---|---|---|
| `tenant_id` | `uuid` | `FK` `NOT NULL` `YENİ` | → tenants.id — RLS için denormalize edildi, eksikti |
| `id` | `uuid` | `PK` |  |
| `board_id` | `uuid` | `FK` `NOT NULL` | → boards.id |
| `name` | `varchar(100)` | `NOT NULL` |  |
| `order_index` | `int` | `NOT NULL` | default 0 |
| `wip_limit` | `int` |  |  |
| `created_by` | `uuid` | `FK` `YENİ` | → users.id — genel revizyonda eklendi (audit/hesap verebilirlik) |
| `created_at` | `timestamptz` | `YENİ` | eksikti — eklendi |
| `deleted_at` | `timestamptz` | `YENİ` | NULL = aktif; doluysa soft-delete edilmiş — genel revizyonda eklendi |

### İndeksler

- `(tenant_id, board_id, order_index)`

<CopyCodeButton code={"CREATE TABLE board_columns (\n  tenant_id uuid NOT NULL REFERENCES tenants(id),  -- → tenants.id — RLS için denormalize edildi, eksikti\n  id uuid PRIMARY KEY,\n  board_id uuid NOT NULL REFERENCES boards(id),    -- → boards.id\n  name varchar(100) NOT NULL,\n  order_index int DEFAULT 0 NOT NULL,              -- default 0\n  wip_limit int,\n  created_by uuid REFERENCES users(id),            -- → users.id — genel revizyonda eklendi (audit/hesap verebilirlik)\n  created_at timestamptz,                          -- eksikti — eklendi\n  deleted_at timestamptz                           -- NULL = aktif; doluysa soft-delete edilmiş — genel revizyonda eklendi\n);\n\nCREATE INDEX idx_board_columns_1 ON board_columns (tenant_id, board_id, order_index);"} label="📋 CREATE TABLE SQL'ini Kopyala" />
