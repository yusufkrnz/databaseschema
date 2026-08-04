---
sidebar_position: 9
title: attachments
---

import CopyCodeButton from '@site/src/components/CopyCodeButton';

# attachments

`POSTGRESQL` · Core — Multi-tenant Çekirdek

Herhangi bir entity'e bağlı dosya kaydı (polimorfik).

## Alanlar

| Alan | Tip | Kısıtlar | Not |
|---|---|---|---|
| `id` | `uuid` | `PK` |  |
| `tenant_id` | `uuid` | `FK` `NOT NULL` | → tenants.id |
| `entity_type` | `varchar(50)` | `NOT NULL` |  |
| `entity_id` | `uuid` | `NOT NULL` |  |
| `file_name` | `varchar(255)` | `NOT NULL` |  |
| `file_url` | `text` | `NOT NULL` |  |
| `file_size_bytes` | `bigint` |  |  |
| `uploaded_by` | `uuid` | `FK` | → users.id |
| `created_at` | `timestamptz` |  | default now() |

### İndeksler

- `(tenant_id, entity_type, entity_id)`
- `(tenant_id, uploaded_by)`

<CopyCodeButton code={"CREATE TABLE attachments (\n  id uuid PRIMARY KEY,\n  tenant_id uuid NOT NULL REFERENCES tenants(id),  -- → tenants.id\n  entity_type varchar(50) NOT NULL,\n  entity_id uuid NOT NULL,\n  file_name varchar(255) NOT NULL,\n  file_url text NOT NULL,\n  file_size_bytes bigint,\n  uploaded_by uuid REFERENCES users(id),           -- → users.id\n  created_at timestamptz DEFAULT now()             -- default now()\n);\n\nCREATE INDEX idx_attachments_1 ON attachments (tenant_id, entity_type, entity_id);\nCREATE INDEX idx_attachments_2 ON attachments (tenant_id, uploaded_by);"} label="📋 CREATE TABLE SQL'ini Kopyala" />
