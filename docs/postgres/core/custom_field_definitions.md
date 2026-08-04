---
sidebar_position: 7
title: custom_field_definitions
---

import CopyCodeButton from '@site/src/components/CopyCodeButton';

# custom_field_definitions

`POSTGRESQL` · Core — Multi-tenant Çekirdek

Tenant'ların kendi entity'lerine (deal, contact vb.) eklediği özel alan tanımları. EAV benzeri esnek şema ihtiyacının Postgres tarafındaki çözümü — MongoDB'deki alternatif modeli için bkz. [MongoDB → custom_field_values](/mongodb/custom-field-values).

## Alanlar

| Alan | Tip | Kısıtlar | Not |
|---|---|---|---|
| `id` | `uuid` | `PK` |  |
| `tenant_id` | `uuid` | `FK` `NOT NULL` | → tenants.id |
| `entity_type` | `varchar(50)` | `NOT NULL` |  |
| `field_key` | `varchar(100)` | `NOT NULL` |  |
| `field_label` | `varchar(150)` | `NOT NULL` |  |
| `field_type` | `varchar(50)` | `NOT NULL` |  |
| `field_options` | `jsonb` |  |  |
| `is_required` | `boolean` |  | default false |
| `display_order` | `int` |  | default 0 |
| `created_by` | `uuid` | `FK` `YENİ` | → users.id — genel revizyonda eklendi (audit/hesap verebilirlik) |
| `deleted_at` | `timestamptz` | `YENİ` | NULL = aktif; doluysa soft-delete edilmiş — genel revizyonda eklendi |

### İndeksler

- `(tenant_id, entity_type, field_key) — UNIQUE`

<CopyCodeButton code={"CREATE TABLE custom_field_definitions (\n  id uuid PRIMARY KEY,\n  tenant_id uuid NOT NULL REFERENCES tenants(id),  -- → tenants.id\n  entity_type varchar(50) NOT NULL,\n  field_key varchar(100) NOT NULL,\n  field_label varchar(150) NOT NULL,\n  field_type varchar(50) NOT NULL,\n  field_options jsonb,\n  is_required boolean DEFAULT false,               -- default false\n  display_order int DEFAULT 0,                     -- default 0\n  created_by uuid REFERENCES users(id),            -- → users.id — genel revizyonda eklendi (audit/hesap verebilirlik)\n  deleted_at timestamptz                           -- NULL = aktif; doluysa soft-delete edilmiş — genel revizyonda eklendi\n);\n\nCREATE UNIQUE INDEX idx_custom_field_definitions_1 ON custom_field_definitions (tenant_id, entity_type, field_key);"} label="📋 CREATE TABLE SQL'ini Kopyala" />
