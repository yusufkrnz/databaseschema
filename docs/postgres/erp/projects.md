---
sidebar_position: 1
title: projects
---

import CopyCodeButton from '@site/src/components/CopyCodeButton';

# projects

`POSTGRESQL` · ERP / İç Operasyon

İç operasyon projesi; code alanı kısa referans (örn. PRJ-001) taşır.

## Alanlar

| Alan | Tip | Kısıtlar | Not |
|---|---|---|---|
| `id` | `uuid` | `PK` |  |
| `tenant_id` | `uuid` | `FK` `NOT NULL` | → tenants.id |
| `code` | `varchar(50)` |  | PRJ-001 gibi kısa referans |
| `name` | `varchar(255)` | `NOT NULL` |  |
| `description` | `text` |  |  |
| `status` | `varchar(20)` |  | default 'active' |
| `priority` | `varchar(20)` |  | default 'medium' |
| `owner_id` | `uuid` | `FK` | → users.id |
| `start_date` | `date` |  |  |
| `end_date` | `date` |  |  |
| `budget` | `numeric(14,2)` |  |  |
| `custom_fields` | `jsonb` |  |  |
| `created_by` | `uuid` | `FK` `YENİ` | → users.id — genel revizyonda eklendi (audit/hesap verebilirlik) |
| `updated_by` | `uuid` | `FK` `YENİ` | → users.id — genel revizyonda eklendi |
| `created_at` | `timestamptz` |  | default now() |
| `updated_at` | `timestamptz` | `YENİ` | eksikti — eklendi |
| `deleted_at` | `timestamptz` | `YENİ` | NULL = aktif; doluysa soft-delete edilmiş — genel revizyonda eklendi |

### İndeksler

- `(tenant_id, status)`
- `(tenant_id, owner_id)`

<CopyCodeButton code={"CREATE TABLE projects (\n  id uuid PRIMARY KEY,\n  tenant_id uuid NOT NULL REFERENCES tenants(id),  -- → tenants.id\n  code varchar(50),                                -- PRJ-001 gibi kısa referans\n  name varchar(255) NOT NULL,\n  description text,\n  status varchar(20) DEFAULT 'active',             -- default 'active'\n  priority varchar(20) DEFAULT 'medium',           -- default 'medium'\n  owner_id uuid REFERENCES users(id),              -- → users.id\n  start_date date,\n  end_date date,\n  budget numeric(14,2),\n  custom_fields jsonb,\n  created_by uuid REFERENCES users(id),            -- → users.id — genel revizyonda eklendi (audit/hesap verebilirlik)\n  updated_by uuid REFERENCES users(id),            -- → users.id — genel revizyonda eklendi\n  created_at timestamptz DEFAULT now(),            -- default now()\n  updated_at timestamptz,                          -- eksikti — eklendi\n  deleted_at timestamptz                           -- NULL = aktif; doluysa soft-delete edilmiş — genel revizyonda eklendi\n);\n\nCREATE INDEX idx_projects_1 ON projects (tenant_id, status);\nCREATE INDEX idx_projects_2 ON projects (tenant_id, owner_id);"} label="📋 CREATE TABLE SQL'ini Kopyala" />
