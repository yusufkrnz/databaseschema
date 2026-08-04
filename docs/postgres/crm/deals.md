---
sidebar_position: 5
title: deals
---

import CopyCodeButton from '@site/src/components/CopyCodeButton';

# deals

`POSTGRESQL` · CRM

Satış fırsatı. Bir company/contact'a, bir pipeline_stage'e bağlanır; amount/probability üzerinden pipeline değeri hesaplanır.

## Alanlar

| Alan | Tip | Kısıtlar | Not |
|---|---|---|---|
| `id` | `uuid` | `PK` |  |
| `tenant_id` | `uuid` | `FK` `NOT NULL` | → tenants.id |
| `company_id` | `uuid` | `FK` | → companies.id |
| `contact_id` | `uuid` | `FK` | → contacts.id |
| `stage_id` | `uuid` | `FK` | → pipeline_stages.id |
| `title` | `varchar(255)` | `NOT NULL` |  |
| `amount` | `numeric(14,2)` |  |  |
| `currency` | `varchar(10)` |  | default 'TRY' |
| `probability` | `smallint` | `YENİ` | 0-100 arası, CHECK constraint — önceki revizyonda int'ti, daraltıldı |
| `expected_close_date` | `date` |  |  |
| `source` | `varchar(100)` |  |  |
| `owner_id` | `uuid` | `FK` | → users.id |
| `status` | `varchar(20)` |  | default 'open' |
| `lost_reason` | `varchar(255)` |  |  |
| `custom_fields` | `jsonb` |  |  |
| `created_by` | `uuid` | `FK` `YENİ` | → users.id — genel revizyonda eklendi (audit/hesap verebilirlik) |
| `updated_by` | `uuid` | `FK` `YENİ` | → users.id — genel revizyonda eklendi |
| `created_at` | `timestamptz` |  | default now() |
| `updated_at` | `timestamptz` |  | default now() |
| `deleted_at` | `timestamptz` | `YENİ` | NULL = aktif; doluysa soft-delete edilmiş — genel revizyonda eklendi |

### İndeksler

- `(tenant_id, stage_id)`
- `(tenant_id, owner_id, status)`
- `(tenant_id, company_id)`

<CopyCodeButton code={"CREATE TABLE deals (\n  id uuid PRIMARY KEY,\n  tenant_id uuid NOT NULL REFERENCES tenants(id),  -- → tenants.id\n  company_id uuid REFERENCES companies(id),        -- → companies.id\n  contact_id uuid REFERENCES contacts(id),         -- → contacts.id\n  stage_id uuid REFERENCES pipeline_stages(id),    -- → pipeline_stages.id\n  title varchar(255) NOT NULL,\n  amount numeric(14,2),\n  currency varchar(10) DEFAULT 'TRY',              -- default 'TRY'\n  probability smallint,                            -- 0-100 arası, CHECK constraint — önceki revizyonda int'ti, daraltıldı\n  expected_close_date date,\n  source varchar(100),\n  owner_id uuid REFERENCES users(id),              -- → users.id\n  status varchar(20) DEFAULT 'open',               -- default 'open'\n  lost_reason varchar(255),\n  custom_fields jsonb,\n  created_by uuid REFERENCES users(id),            -- → users.id — genel revizyonda eklendi (audit/hesap verebilirlik)\n  updated_by uuid REFERENCES users(id),            -- → users.id — genel revizyonda eklendi\n  created_at timestamptz DEFAULT now(),            -- default now()\n  updated_at timestamptz DEFAULT now(),            -- default now()\n  deleted_at timestamptz                           -- NULL = aktif; doluysa soft-delete edilmiş — genel revizyonda eklendi\n);\n\nCREATE INDEX idx_deals_1 ON deals (tenant_id, stage_id);\nCREATE INDEX idx_deals_2 ON deals (tenant_id, owner_id, status);\nCREATE INDEX idx_deals_3 ON deals (tenant_id, company_id);"} label="📋 CREATE TABLE SQL'ini Kopyala" />
