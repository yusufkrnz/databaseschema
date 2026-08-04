---
sidebar_position: 1
title: companies
---

import CopyCodeButton from '@site/src/components/CopyCodeButton';

# companies

`POSTGRESQL` · CRM

Tenant'ın kendi müşteri/tedarikçi defteri. `tenants` tablosuyla karıştırılmamalı — companies, tenant'ın DIŞ dünyada takip ettiği firmalardır.

## Alanlar

| Alan | Tip | Kısıtlar | Not |
|---|---|---|---|
| `id` | `uuid` | `PK` |  |
| `tenant_id` | `uuid` | `FK` `NOT NULL` | → tenants.id |
| `name` | `varchar(255)` | `NOT NULL` |  |
| `company_type` | `varchar(20)` |  | default 'prospect'; prospect/customer/supplier/partner |
| `industry` | `varchar(100)` |  |  |
| `tax_number` | `varchar(50)` |  |  |
| `website` | `varchar(255)` |  |  |
| `phone` | `varchar(50)` |  |  |
| `email` | `varchar(255)` |  |  |
| `employee_count` | `int` |  |  |
| `annual_revenue` | `numeric(16,2)` |  |  |
| `source` | `varchar(100)` |  |  |
| `owner_id` | `uuid` | `FK` | → users.id |
| `status` | `varchar(20)` |  | default 'active' |
| `custom_fields` | `jsonb` |  |  |
| `created_by` | `uuid` | `FK` `YENİ` | → users.id — genel revizyonda eklendi (audit/hesap verebilirlik) |
| `updated_by` | `uuid` | `FK` `YENİ` | → users.id — genel revizyonda eklendi |
| `created_at` | `timestamptz` |  | default now() |
| `updated_at` | `timestamptz` |  | default now() |
| `deleted_at` | `timestamptz` | `YENİ` | NULL = aktif; doluysa soft-delete edilmiş — genel revizyonda eklendi |

### İndeksler

- `(tenant_id, status)`
- `(tenant_id, owner_id)`
- `(tenant_id, company_type)`

<CopyCodeButton code={"CREATE TABLE companies (\n  id uuid PRIMARY KEY,\n  tenant_id uuid NOT NULL REFERENCES tenants(id),  -- → tenants.id\n  name varchar(255) NOT NULL,\n  company_type varchar(20) DEFAULT 'prospect',     -- default 'prospect'; prospect/customer/supplier/partner\n  industry varchar(100),\n  tax_number varchar(50),\n  website varchar(255),\n  phone varchar(50),\n  email varchar(255),\n  employee_count int,\n  annual_revenue numeric(16,2),\n  source varchar(100),\n  owner_id uuid REFERENCES users(id),              -- → users.id\n  status varchar(20) DEFAULT 'active',             -- default 'active'\n  custom_fields jsonb,\n  created_by uuid REFERENCES users(id),            -- → users.id — genel revizyonda eklendi (audit/hesap verebilirlik)\n  updated_by uuid REFERENCES users(id),            -- → users.id — genel revizyonda eklendi\n  created_at timestamptz DEFAULT now(),            -- default now()\n  updated_at timestamptz DEFAULT now(),            -- default now()\n  deleted_at timestamptz                           -- NULL = aktif; doluysa soft-delete edilmiş — genel revizyonda eklendi\n);\n\nCREATE INDEX idx_companies_1 ON companies (tenant_id, status);\nCREATE INDEX idx_companies_2 ON companies (tenant_id, owner_id);\nCREATE INDEX idx_companies_3 ON companies (tenant_id, company_type);"} label="📋 CREATE TABLE SQL'ini Kopyala" />
