---
sidebar_position: 2
title: contacts
---

import CopyCodeButton from '@site/src/components/CopyCodeButton';

# contacts

`POSTGRESQL` · CRM

Bir company'ye bağlı kişi kaydı. `do_not_contact` alanı KVKK uyumluluğu için tutulur.

## Alanlar

| Alan | Tip | Kısıtlar | Not |
|---|---|---|---|
| `id` | `uuid` | `PK` |  |
| `tenant_id` | `uuid` | `FK` `NOT NULL` | → tenants.id |
| `company_id` | `uuid` | `FK` | → companies.id |
| `first_name` | `varchar(150)` | `NOT NULL` |  |
| `last_name` | `varchar(150)` | `NOT NULL` |  |
| `job_title` | `varchar(150)` |  |  |
| `department` | `varchar(150)` |  |  |
| `email` | `varchar(255)` |  |  |
| `phone` | `varchar(50)` |  |  |
| `mobile_phone` | `varchar(50)` |  |  |
| `linkedin_url` | `varchar(255)` |  |  |
| `is_primary` | `boolean` |  | default false |
| `do_not_contact` | `boolean` |  | default false; KVKK |
| `custom_fields` | `jsonb` |  |  |
| `created_by` | `uuid` | `FK` `YENİ` | → users.id — genel revizyonda eklendi (audit/hesap verebilirlik) |
| `updated_by` | `uuid` | `FK` `YENİ` | → users.id — genel revizyonda eklendi |
| `created_at` | `timestamptz` |  | default now() |
| `updated_at` | `timestamptz` | `YENİ` | eksikti — eklendi |
| `deleted_at` | `timestamptz` | `YENİ` | NULL = aktif; doluysa soft-delete edilmiş — genel revizyonda eklendi |

### İndeksler

- `(tenant_id, company_id)`
- `(tenant_id, email)`

<CopyCodeButton code={"CREATE TABLE contacts (\n  id uuid PRIMARY KEY,\n  tenant_id uuid NOT NULL REFERENCES tenants(id),  -- → tenants.id\n  company_id uuid REFERENCES companies(id),        -- → companies.id\n  first_name varchar(150) NOT NULL,\n  last_name varchar(150) NOT NULL,\n  job_title varchar(150),\n  department varchar(150),\n  email varchar(255),\n  phone varchar(50),\n  mobile_phone varchar(50),\n  linkedin_url varchar(255),\n  is_primary boolean DEFAULT false,                -- default false\n  do_not_contact boolean DEFAULT false,            -- default false; KVKK\n  custom_fields jsonb,\n  created_by uuid REFERENCES users(id),            -- → users.id — genel revizyonda eklendi (audit/hesap verebilirlik)\n  updated_by uuid REFERENCES users(id),            -- → users.id — genel revizyonda eklendi\n  created_at timestamptz DEFAULT now(),            -- default now()\n  updated_at timestamptz,                          -- eksikti — eklendi\n  deleted_at timestamptz                           -- NULL = aktif; doluysa soft-delete edilmiş — genel revizyonda eklendi\n);\n\nCREATE INDEX idx_contacts_1 ON contacts (tenant_id, company_id);\nCREATE INDEX idx_contacts_2 ON contacts (tenant_id, email);"} label="📋 CREATE TABLE SQL'ini Kopyala" />
