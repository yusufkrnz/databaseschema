---
sidebar_position: 13
title: notifications
---

import CopyCodeButton from '@site/src/components/CopyCodeButton';

# notifications

`POSTGRESQL` · Core — Multi-tenant Çekirdek

Kullanıcıya gösterilen bildirimler; is_read ile okunma durumu takip edilir.

## Alanlar

| Alan | Tip | Kısıtlar | Not |
|---|---|---|---|
| `id` | `uuid` | `PK` |  |
| `tenant_id` | `uuid` | `FK` `NOT NULL` | → tenants.id |
| `user_id` | `uuid` | `FK` `NOT NULL` | → users.id |
| `entity_type` | `varchar(50)` |  |  |
| `entity_id` | `uuid` |  |  |
| `title` | `varchar(255)` | `NOT NULL` |  |
| `body` | `text` |  |  |
| `is_read` | `boolean` |  | default false |
| `created_at` | `timestamptz` |  | default now() |

### İndeksler

- `(tenant_id, user_id, is_read)`

<CopyCodeButton code={"CREATE TABLE notifications (\n  id uuid PRIMARY KEY,\n  tenant_id uuid NOT NULL REFERENCES tenants(id),  -- → tenants.id\n  user_id uuid NOT NULL REFERENCES users(id),      -- → users.id\n  entity_type varchar(50),\n  entity_id uuid,\n  title varchar(255) NOT NULL,\n  body text,\n  is_read boolean DEFAULT false,                   -- default false\n  created_at timestamptz DEFAULT now()             -- default now()\n);\n\nCREATE INDEX idx_notifications_1 ON notifications (tenant_id, user_id, is_read);"} label="📋 CREATE TABLE SQL'ini Kopyala" />
