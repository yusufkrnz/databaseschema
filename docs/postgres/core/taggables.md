---
sidebar_position: 12
title: taggables
---

import CopyCodeButton from '@site/src/components/CopyCodeButton';

# taggables

`POSTGRESQL` · Core — Multi-tenant Çekirdek

tags ile herhangi bir entity arasındaki çoktan-çoğa polimorfik bağlantı tablosu.

## Alanlar

| Alan | Tip | Kısıtlar | Not |
|---|---|---|---|
| `tenant_id` | `uuid` | `FK` `NOT NULL` `YENİ` | → tenants.id — RLS (Row-Level Security) için denormalize edildi, eksikti |
| `tag_id` | `uuid` | `PK` `FK` `NOT NULL` | → tags.id |
| `entity_type` | `varchar(50)` | `PK` `NOT NULL` |  |
| `entity_id` | `uuid` | `PK` `NOT NULL` |  |

### İndeksler

- `(tag_id, entity_type, entity_id) — PK`
- `(tenant_id, entity_type, entity_id)`

<CopyCodeButton code={"CREATE TABLE taggables (\n  tenant_id uuid NOT NULL REFERENCES tenants(id),  -- → tenants.id — RLS (Row-Level Security) için denormalize edildi, eksikti\n  tag_id uuid REFERENCES tags(id),                 -- → tags.id\n  entity_type varchar(50),\n  entity_id uuid,\n  PRIMARY KEY (tag_id, entity_type, entity_id)\n);\n\nCREATE INDEX idx_taggables_1 ON taggables (tenant_id, entity_type, entity_id);"} label="📋 CREATE TABLE SQL'ini Kopyala" />
