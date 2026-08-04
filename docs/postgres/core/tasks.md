---
sidebar_position: 10
title: tasks
---

import CopyCodeButton from '@site/src/components/CopyCodeButton';

# tasks

`POSTGRESQL` · Core — Multi-tenant Çekirdek

Yapılacak iş kaydı; hem serbest to-do hem de bir board_column üzerinde kanban kartı olarak kullanılabilir.

## Alanlar

| Alan | Tip | Kısıtlar | Not |
|---|---|---|---|
| `id` | `uuid` | `PK` |  |
| `tenant_id` | `uuid` | `FK` `NOT NULL` | → tenants.id |
| `entity_type` | `varchar(50)` |  |  |
| `entity_id` | `uuid` |  |  |
| `title` | `varchar(255)` | `NOT NULL` |  |
| `description` | `text` |  |  |
| `priority` | `varchar(20)` |  | default 'medium' |
| `due_date` | `timestamptz` |  |  |
| `assigned_to` | `uuid` | `FK` | → users.id |
| `status` | `varchar(20)` |  | default 'open' |
| `board_column_id` | `uuid` | `FK` | → board_columns.id |
| `card_order` | `int` |  | default 0 |
| `story_points` | `int` |  |  |
| `completed_at` | `timestamptz` | `YENİ` | eksikti — status='done' olduğunda set edilir |
| `created_by` | `uuid` | `FK` `YENİ` | → users.id — genel revizyonda eklendi (audit/hesap verebilirlik) |
| `updated_by` | `uuid` | `FK` `YENİ` | → users.id — genel revizyonda eklendi |
| `created_at` | `timestamptz` |  | default now() |
| `updated_at` | `timestamptz` | `YENİ` | eksikti — eklendi |
| `deleted_at` | `timestamptz` | `YENİ` | NULL = aktif; doluysa soft-delete edilmiş — genel revizyonda eklendi |

### İndeksler

- `(tenant_id, entity_type, entity_id)`
- `(tenant_id, assigned_to, status)`
- `(board_column_id, card_order)`

<CopyCodeButton code={"CREATE TABLE tasks (\n  id uuid PRIMARY KEY,\n  tenant_id uuid NOT NULL REFERENCES tenants(id),     -- → tenants.id\n  entity_type varchar(50),\n  entity_id uuid,\n  title varchar(255) NOT NULL,\n  description text,\n  priority varchar(20) DEFAULT 'medium',              -- default 'medium'\n  due_date timestamptz,\n  assigned_to uuid REFERENCES users(id),              -- → users.id\n  status varchar(20) DEFAULT 'open',                  -- default 'open'\n  board_column_id uuid REFERENCES board_columns(id),  -- → board_columns.id\n  card_order int DEFAULT 0,                           -- default 0\n  story_points int,\n  completed_at timestamptz,                           -- eksikti — status='done' olduğunda set edilir\n  created_by uuid REFERENCES users(id),               -- → users.id — genel revizyonda eklendi (audit/hesap verebilirlik)\n  updated_by uuid REFERENCES users(id),               -- → users.id — genel revizyonda eklendi\n  created_at timestamptz DEFAULT now(),               -- default now()\n  updated_at timestamptz,                             -- eksikti — eklendi\n  deleted_at timestamptz                              -- NULL = aktif; doluysa soft-delete edilmiş — genel revizyonda eklendi\n);\n\nCREATE INDEX idx_tasks_1 ON tasks (tenant_id, entity_type, entity_id);\nCREATE INDEX idx_tasks_2 ON tasks (tenant_id, assigned_to, status);\nCREATE INDEX idx_tasks_3 ON tasks (board_column_id, card_order);"} label="📋 CREATE TABLE SQL'ini Kopyala" />
