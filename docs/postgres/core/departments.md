---
sidebar_position: 2
title: departments
why: ["Engellenen edge case — 'referansı var ama değeri yok' boşluğu: tenant_token_usage.department_id, hangi departmanın ne kadar tükettiğini kaydediyor ama ÜST SINIRIN kendisi hiçbir yerde tanımlı değildi. token_limit_monthly olmadan 'departman kotası' sadece kavramsal kalır, uygulanamaz.","is_active olmadan bir departman kapatıldığında geçmiş tenant_token_usage/tasks kayıtları FK bütünlüğünü korumak için hâlâ o departmana işaret eder ama kullanıcı arayüzünde artık seçilebilir olmamalı — soft-disable bunun için var."]
---

import CopyCodeButton from '@site/src/components/CopyCodeButton';

# departments

`POSTGRESQL` · Core — Multi-tenant Çekirdek

Tenant içi organizasyon birimleri; parent_department_id ile iç içe dallanabilir (İK → İşe Alım gibi).

_"Neden bu şekilde tasarlandı" gerekçeleri sağdaki (mobilde başlığın altındaki) bilgi kartında._

## Alanlar

| Alan | Tip | Kısıtlar | Not |
|---|---|---|---|
| `id` | `uuid` | `PK` |  |
| `tenant_id` | `uuid` | `FK` `NOT NULL` | → tenants.id |
| `name` | `varchar(150)` | `NOT NULL` | İK, Satış, Customer Success, Muhasebe… |
| `parent_department_id` | `uuid` | `FK` | → departments.id, iç içe dallanma |
| `head_user_id` | `uuid` | `FK` | → users.id |
| `token_limit_monthly` | `bigint` | `YENİ` | NULL = üst sınır yok (tenant ortak havuzunu kullanır); doluysa bu departmanın aylık üst sınırı |
| `is_active` | `boolean` | `YENİ` | default true; departman kapatıldığında geçmiş kayıtları bozmadan pasife çekmek için |
| `created_by` | `uuid` | `FK` `YENİ` | → users.id — genel revizyonda eklendi (audit/hesap verebilirlik) |
| `created_at` | `timestamptz` |  | default now() |

### İndeksler

- `(tenant_id)`
- `(tenant_id, parent_department_id)`

<CopyCodeButton code={"CREATE TABLE departments (\n  id uuid PRIMARY KEY,\n  tenant_id uuid NOT NULL REFERENCES tenants(id),        -- → tenants.id\n  name varchar(150) NOT NULL,                            -- İK, Satış, Customer Success, Muhasebe…\n  parent_department_id uuid REFERENCES departments(id),  -- → departments.id, iç içe dallanma\n  head_user_id uuid REFERENCES users(id),                -- → users.id\n  token_limit_monthly bigint,                            -- NULL = üst sınır yok (tenant ortak havuzunu kullanır); doluysa bu departmanın aylık üst sınırı\n  is_active boolean DEFAULT true,                        -- default true; departman kapatıldığında geçmiş kayıtları bozmadan pasife çekmek için\n  created_by uuid REFERENCES users(id),                  -- → users.id — genel revizyonda eklendi (audit/hesap verebilirlik)\n  created_at timestamptz DEFAULT now()                   -- default now()\n);\n\nCREATE INDEX idx_departments_1 ON departments (tenant_id);\nCREATE INDEX idx_departments_2 ON departments (tenant_id, parent_department_id);"} label="📋 CREATE TABLE SQL'ini Kopyala" />
