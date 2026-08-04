---
sidebar_position: 5
title: calendar_events
---

import CopyCodeButton from '@site/src/components/CopyCodeButton';

# calendar_events

`POSTGRESQL` · ERP / İç Operasyon

Takvim etkinliği; entity_type/entity_id ile başka bir kayda (örn. bir deal görüşmesi) bağlanabilir, dış takvim senkronizasyonu için provider/id alanları taşır.

## Alanlar

| Alan | Tip | Kısıtlar | Not |
|---|---|---|---|
| `id` | `uuid` | `PK` |  |
| `tenant_id` | `uuid` | `FK` `NOT NULL` | → tenants.id |
| `title` | `varchar(255)` | `NOT NULL` |  |
| `description` | `text` |  |  |
| `start_time` | `timestamptz` | `NOT NULL` |  |
| `end_time` | `timestamptz` | `NOT NULL` |  |
| `is_all_day` | `boolean` |  | default false |
| `location` | `varchar(255)` |  |  |
| `entity_type` | `varchar(50)` |  |  |
| `entity_id` | `uuid` |  |  |
| `external_calendar_provider` | `varchar(50)` |  |  |
| `external_event_id` | `varchar(255)` |  |  |
| `created_by` | `uuid` | `FK` | → users.id |
| `created_at` | `timestamptz` |  | default now() |
| `updated_at` | `timestamptz` | `YENİ` | eksikti — eklendi |

### İndeksler

- `(tenant_id, start_time)`
- `(tenant_id, entity_type, entity_id)`

<CopyCodeButton code={"CREATE TABLE calendar_events (\n  id uuid PRIMARY KEY,\n  tenant_id uuid NOT NULL REFERENCES tenants(id),  -- → tenants.id\n  title varchar(255) NOT NULL,\n  description text,\n  start_time timestamptz NOT NULL,\n  end_time timestamptz NOT NULL,\n  is_all_day boolean DEFAULT false,                -- default false\n  location varchar(255),\n  entity_type varchar(50),\n  entity_id uuid,\n  external_calendar_provider varchar(50),\n  external_event_id varchar(255),\n  created_by uuid REFERENCES users(id),            -- → users.id\n  created_at timestamptz DEFAULT now(),            -- default now()\n  updated_at timestamptz                           -- eksikti — eklendi\n);\n\nCREATE INDEX idx_calendar_events_1 ON calendar_events (tenant_id, start_time);\nCREATE INDEX idx_calendar_events_2 ON calendar_events (tenant_id, entity_type, entity_id);"} label="📋 CREATE TABLE SQL'ini Kopyala" />
