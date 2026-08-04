---
sidebar_position: 6
title: calendar_event_attendees
---

import CopyCodeButton from '@site/src/components/CopyCodeButton';

# calendar_event_attendees

`POSTGRESQL` · ERP / İç Operasyon

Bir etkinliğe davetli kullanıcılar ve RSVP durumu.

## Alanlar

| Alan | Tip | Kısıtlar | Not |
|---|---|---|---|
| `tenant_id` | `uuid` | `FK` `NOT NULL` `YENİ` | → tenants.id — RLS için denormalize edildi, eksikti |
| `event_id` | `uuid` | `PK` `FK` `NOT NULL` | → calendar_events.id |
| `user_id` | `uuid` | `PK` `FK` `NOT NULL` | → users.id |
| `rsvp_status` | `varchar(20)` |  | default 'pending' |

### İndeksler

- `(event_id, user_id) — PK`
- `(tenant_id, user_id)`

<CopyCodeButton code={"CREATE TABLE calendar_event_attendees (\n  tenant_id uuid NOT NULL REFERENCES tenants(id),  -- → tenants.id — RLS için denormalize edildi, eksikti\n  event_id uuid REFERENCES calendar_events(id),    -- → calendar_events.id\n  user_id uuid REFERENCES users(id),               -- → users.id\n  rsvp_status varchar(20) DEFAULT 'pending',       -- default 'pending'\n  PRIMARY KEY (event_id, user_id)\n);\n\nCREATE INDEX idx_calendar_event_attendees_1 ON calendar_event_attendees (tenant_id, user_id);"} label="📋 CREATE TABLE SQL'ini Kopyala" />
