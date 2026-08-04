---
sidebar_position: 3
title: job_levels
---

import CopyCodeButton from '@site/src/components/CopyCodeButton';

# job_levels

`POSTGRESQL` · Core — Multi-tenant Çekirdek

Onay zincirlerinde kullanılan kademe tanımları (rank ne kadar düşükse o kadar üst kademe).

## Alanlar

| Alan | Tip | Kısıtlar | Not |
|---|---|---|---|
| `id` | `uuid` | `PK` |  |
| `tenant_id` | `uuid` | `FK` `NOT NULL` | → tenants.id |
| `name` | `varchar(100)` | `NOT NULL` | Direktör, Müdür, Takım Lideri, Uzman, Çalışan |
| `rank` | `int` | `NOT NULL` | 1 = en üst |
| `created_by` | `uuid` | `FK` `YENİ` | → users.id — genel revizyonda eklendi (audit/hesap verebilirlik) |

### İndeksler

- `(tenant_id, rank) — UNIQUE`

<CopyCodeButton code={"CREATE TABLE job_levels (\n  id uuid PRIMARY KEY,\n  tenant_id uuid NOT NULL REFERENCES tenants(id),  -- → tenants.id\n  name varchar(100) NOT NULL,                      -- Direktör, Müdür, Takım Lideri, Uzman, Çalışan\n  rank int NOT NULL,                               -- 1 = en üst\n  created_by uuid REFERENCES users(id)             -- → users.id — genel revizyonda eklendi (audit/hesap verebilirlik)\n);\n\nCREATE UNIQUE INDEX idx_job_levels_1 ON job_levels (tenant_id, rank);"} label="📋 CREATE TABLE SQL'ini Kopyala" />
