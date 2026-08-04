---
sidebar_position: 4
title: roles
---

import CopyCodeButton from '@site/src/components/CopyCodeButton';

# roles

`POSTGRESQL` · Core — Multi-tenant Çekirdek

Yetkilendirme rolleri; roles_permissions ile entity bazlı izinlere bağlanır.

## Alanlar

| Alan | Tip | Kısıtlar | Not |
|---|---|---|---|
| `id` | `uuid` | `PK` |  |
| `tenant_id` | `uuid` | `FK` `NOT NULL` | → tenants.id |
| `name` | `varchar(150)` | `NOT NULL` |  |
| `is_system_role` | `boolean` |  | default false |
| `created_by` | `uuid` | `FK` `YENİ` | → users.id — genel revizyonda eklendi (audit/hesap verebilirlik) |
| `created_at` | `timestamptz` |  | default now() |

### İndeksler

- `(tenant_id, name) — UNIQUE`

<CopyCodeButton code={"CREATE TABLE roles (\n  id uuid PRIMARY KEY,\n  tenant_id uuid NOT NULL REFERENCES tenants(id),  -- → tenants.id\n  name varchar(150) NOT NULL,\n  is_system_role boolean DEFAULT false,            -- default false\n  created_by uuid REFERENCES users(id),            -- → users.id — genel revizyonda eklendi (audit/hesap verebilirlik)\n  created_at timestamptz DEFAULT now()             -- default now()\n);\n\nCREATE UNIQUE INDEX idx_roles_1 ON roles (tenant_id, name);"} label="📋 CREATE TABLE SQL'ini Kopyala" />
