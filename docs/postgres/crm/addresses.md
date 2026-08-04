---
sidebar_position: 3
title: addresses
---

import CopyCodeButton from '@site/src/components/CopyCodeButton';

# addresses

`POSTGRESQL` · CRM

Bir company'ye bağlı adres kaydı; bir firmanın birden çok adresi olabilir.

## Alanlar

| Alan | Tip | Kısıtlar | Not |
|---|---|---|---|
| `id` | `uuid` | `PK` |  |
| `tenant_id` | `uuid` | `FK` `NOT NULL` | → tenants.id |
| `company_id` | `uuid` | `FK` | → companies.id |
| `address_type` | `varchar(20)` |  | default 'office' |
| `country` | `varchar(100)` |  |  |
| `city` | `varchar(100)` |  |  |
| `district` | `varchar(100)` |  |  |
| `full_address` | `text` |  |  |
| `postal_code` | `varchar(20)` |  |  |
| `created_by` | `uuid` | `FK` `YENİ` | → users.id — genel revizyonda eklendi (audit/hesap verebilirlik) |
| `created_at` | `timestamptz` | `YENİ` | eksikti — hiç timestamp yoktu, eklendi |
| `deleted_at` | `timestamptz` | `YENİ` | NULL = aktif; doluysa soft-delete edilmiş — genel revizyonda eklendi |

### İndeksler

- `(tenant_id, company_id)`

<CopyCodeButton code={"CREATE TABLE addresses (\n  id uuid PRIMARY KEY,\n  tenant_id uuid NOT NULL REFERENCES tenants(id),  -- → tenants.id\n  company_id uuid REFERENCES companies(id),        -- → companies.id\n  address_type varchar(20) DEFAULT 'office',       -- default 'office'\n  country varchar(100),\n  city varchar(100),\n  district varchar(100),\n  full_address text,\n  postal_code varchar(20),\n  created_by uuid REFERENCES users(id),            -- → users.id — genel revizyonda eklendi (audit/hesap verebilirlik)\n  created_at timestamptz,                          -- eksikti — hiç timestamp yoktu, eklendi\n  deleted_at timestamptz                           -- NULL = aktif; doluysa soft-delete edilmiş — genel revizyonda eklendi\n);\n\nCREATE INDEX idx_addresses_1 ON addresses (tenant_id, company_id);"} label="📋 CREATE TABLE SQL'ini Kopyala" />
