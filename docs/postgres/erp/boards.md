---
sidebar_position: 3
title: boards
---

import CopyCodeButton from '@site/src/components/CopyCodeButton';

# boards

`POSTGRESQL` · ERP / İç Operasyon

Bir projeye bağlı kanban/görev panosu.

## Alanlar

| Alan | Tip | Kısıtlar | Not |
|---|---|---|---|
| `id` | `uuid` | `PK` |  |
| `tenant_id` | `uuid` | `FK` `NOT NULL` | → tenants.id |
| `project_id` | `uuid` | `FK` `NOT NULL` | → projects.id |
| `name` | `varchar(255)` | `NOT NULL` |  |
| `board_type` | `varchar(20)` |  | default 'kanban' |
| `created_by` | `uuid` | `FK` `YENİ` | → users.id — genel revizyonda eklendi (audit/hesap verebilirlik) |
| `updated_by` | `uuid` | `FK` `YENİ` | → users.id — genel revizyonda eklendi |
| `created_at` | `timestamptz` |  | default now() |
| `updated_at` | `timestamptz` | `YENİ` | eksikti — eklendi |
| `deleted_at` | `timestamptz` | `YENİ` | NULL = aktif; doluysa soft-delete edilmiş — genel revizyonda eklendi |

### İndeksler

- `(tenant_id, project_id)`

<CopyCodeButton code={"CREATE TABLE boards (\n  id uuid PRIMARY KEY,\n  tenant_id uuid NOT NULL REFERENCES tenants(id),    -- → tenants.id\n  project_id uuid NOT NULL REFERENCES projects(id),  -- → projects.id\n  name varchar(255) NOT NULL,\n  board_type varchar(20) DEFAULT 'kanban',           -- default 'kanban'\n  created_by uuid REFERENCES users(id),              -- → users.id — genel revizyonda eklendi (audit/hesap verebilirlik)\n  updated_by uuid REFERENCES users(id),              -- → users.id — genel revizyonda eklendi\n  created_at timestamptz DEFAULT now(),              -- default now()\n  updated_at timestamptz,                            -- eksikti — eklendi\n  deleted_at timestamptz                             -- NULL = aktif; doluysa soft-delete edilmiş — genel revizyonda eklendi\n);\n\nCREATE INDEX idx_boards_1 ON boards (tenant_id, project_id);"} label="📋 CREATE TABLE SQL'ini Kopyala" />
