---
sidebar_position: 8
title: activities
---

import CopyCodeButton from '@site/src/components/CopyCodeButton';

# activities

`POSTGRESQL` · Core — Multi-tenant Çekirdek

Herhangi bir entity üzerindeki etkileşim geçmişi (arama, e-posta, not). entity_type/entity_id polimorfik ilişki kurar. MongoDB'de tip-özel alanlarla zenginleştirilmiş alternatif modeli için bkz. [MongoDB → activities](/mongodb/activities).

## Alanlar

| Alan | Tip | Kısıtlar | Not |
|---|---|---|---|
| `id` | `uuid` | `PK` |  |
| `tenant_id` | `uuid` | `FK` `NOT NULL` | → tenants.id |
| `entity_type` | `varchar(50)` | `NOT NULL` | örn. 'deal', 'contact' |
| `entity_id` | `uuid` | `NOT NULL` |  |
| `activity_type` | `varchar(50)` | `NOT NULL` | call/email/note/meeting |
| `subject` | `varchar(255)` |  |  |
| `content` | `text` |  |  |
| `duration_minutes` | `int` |  |  |
| `outcome` | `varchar(100)` |  |  |
| `created_by` | `uuid` | `FK` | → users.id |
| `created_at` | `timestamptz` |  | default now() |

### İndeksler

- `(tenant_id, entity_type, entity_id)`
- `(tenant_id, created_by)`

<CopyCodeButton code={"CREATE TABLE activities (\n  id uuid PRIMARY KEY,\n  tenant_id uuid NOT NULL REFERENCES tenants(id),  -- → tenants.id\n  entity_type varchar(50) NOT NULL,                -- örn. 'deal', 'contact'\n  entity_id uuid NOT NULL,\n  activity_type varchar(50) NOT NULL,              -- call/email/note/meeting\n  subject varchar(255),\n  content text,\n  duration_minutes int,\n  outcome varchar(100),\n  created_by uuid REFERENCES users(id),            -- → users.id\n  created_at timestamptz DEFAULT now()             -- default now()\n);\n\nCREATE INDEX idx_activities_1 ON activities (tenant_id, entity_type, entity_id);\nCREATE INDEX idx_activities_2 ON activities (tenant_id, created_by);"} label="📋 CREATE TABLE SQL'ini Kopyala" />
