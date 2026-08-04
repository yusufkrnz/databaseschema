---
sidebar_position: 6
title: roles_permissions
---

import CopyCodeButton from '@site/src/components/CopyCodeButton';

# roles_permissions

`POSTGRESQL` · Core — Multi-tenant Çekirdek

Bir rolün, bir entity_type üzerindeki CRUD + onay yetkisi. RBAC matrisinin satırları.

## Alanlar

| Alan | Tip | Kısıtlar | Not |
|---|---|---|---|
| `id` | `uuid` | `PK` |  |
| `tenant_id` | `uuid` | `FK` `NOT NULL` | → tenants.id |
| `role_id` | `uuid` | `FK` `NOT NULL` | → roles.id |
| `entity_type` | `varchar(50)` | `NOT NULL` |  |
| `can_read` | `boolean` |  | default true |
| `can_write` | `boolean` |  | default false |
| `can_delete` | `boolean` |  | default false |
| `can_approve` | `boolean` |  | default false |

### İndeksler

- `(tenant_id, role_id, entity_type) — UNIQUE`

<CopyCodeButton code={"CREATE TABLE roles_permissions (\n  id uuid PRIMARY KEY,\n  tenant_id uuid NOT NULL REFERENCES tenants(id),  -- → tenants.id\n  role_id uuid NOT NULL REFERENCES roles(id),      -- → roles.id\n  entity_type varchar(50) NOT NULL,\n  can_read boolean DEFAULT true,                   -- default true\n  can_write boolean DEFAULT false,                 -- default false\n  can_delete boolean DEFAULT false,                -- default false\n  can_approve boolean DEFAULT false                -- default false\n);\n\nCREATE UNIQUE INDEX idx_roles_permissions_1 ON roles_permissions (tenant_id, role_id, entity_type);"} label="📋 CREATE TABLE SQL'ini Kopyala" />
