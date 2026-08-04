---
sidebar_position: 2
title: role_permissions
why: ["tenant_id NULL/dolu ayrımı, global bir kuralı bozmadan tek bir tenant için istisna tanımlamamıza izin veriyor.","granted_by + granted_at ile 'bu izni kim, ne zaman verdi' sorusu ayrı bir audit sorgusuna gitmeden bu tablodan cevaplanabiliyor."]
---

import CopyCodeButton from '@site/src/components/CopyCodeButton';

# role_permissions

`POSTGRESQL` · Platform & Yetkilendirme

Köprü tablo — 'kime ne verildi'. `tenant_id` NULL ise global atama (örn. admin rolü her yerde bu izne sahip), doluysa sadece o tenant için tanımlanmış istisna.

_"Neden bu şekilde tasarlandı" gerekçeleri sağdaki (mobilde başlığın altındaki) bilgi kartında._

## Alanlar

| Alan | Tip | Kısıtlar | Not |
|---|---|---|---|
| `id` | `uuid` | `PK` |  |
| `tenant_id` | `uuid` | `FK` | → tenants.id, NULL = global atama |
| `role_id` | `uuid` | `FK` `NOT NULL` | → roles.id |
| `permission_id` | `uuid` | `FK` `NOT NULL` | → permissions.id |
| `granted_by` | `uuid` | `FK` | → users.id, audit için |
| `granted_at` | `timestamptz` |  | default now() |

### İndeksler

- `(role_id, permission_id, tenant_id) — UNIQUE`

<CopyCodeButton code={"CREATE TABLE role_permissions (\n  id uuid PRIMARY KEY,\n  tenant_id uuid REFERENCES tenants(id),                   -- → tenants.id, NULL = global atama\n  role_id uuid NOT NULL REFERENCES roles(id),              -- → roles.id\n  permission_id uuid NOT NULL REFERENCES permissions(id),  -- → permissions.id\n  granted_by uuid REFERENCES users(id),                    -- → users.id, audit için\n  granted_at timestamptz DEFAULT now()                     -- default now()\n);\n\nCREATE UNIQUE INDEX idx_role_permissions_1 ON role_permissions (role_id, permission_id, tenant_id);"} label="📋 CREATE TABLE SQL'ini Kopyala" />
