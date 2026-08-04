---
sidebar_position: 5
title: users
why: ["Engellenen edge case — 'kim davet etti' bilgisinin kaybolması: status alanı zaten 'invited' değerini taşıyor, yani bir kullanıcı başka biri tarafından davet ediliyor — ama created_by olmadan bu davetin kim tarafından yapıldığı hiçbir yerde tutulmuyordu. created_by (kendine referans, manager_id ile aynı desende) bunu kapatıyor.","updated_by, bir kullanıcının rolünü/departmanını kim değiştirdiğini (kendisi mi, bir admin mi) ayırt etmek için gerekli — audit_log'a gitmeden hızlı bir 'son kim dokundu' cevabı verir."]
---

import CopyCodeButton from '@site/src/components/CopyCodeButton';

# users

`POSTGRESQL` · Core — Multi-tenant Çekirdek

Tenant çalışanı / sistem kullanıcısı. manager_id ile kendine referans veren organizasyon hiyerarşisi kurulur.

_"Neden bu şekilde tasarlandı" gerekçeleri sağdaki (mobilde başlığın altındaki) bilgi kartında._

## Alanlar

| Alan | Tip | Kısıtlar | Not |
|---|---|---|---|
| `id` | `uuid` | `PK` |  |
| `tenant_id` | `uuid` | `FK` `NOT NULL` | → tenants.id |
| `first_name` | `varchar(150)` | `NOT NULL` |  |
| `last_name` | `varchar(150)` | `NOT NULL` |  |
| `email` | `varchar(255)` | `NOT NULL` |  |
| `phone` | `varchar(50)` |  |  |
| `avatar_url` | `text` |  |  |
| `job_title` | `varchar(150)` |  |  |
| `department_id` | `uuid` | `FK` | → departments.id |
| `job_level_id` | `uuid` | `FK` | → job_levels.id |
| `role_id` | `uuid` | `FK` | → roles.id |
| `manager_id` | `uuid` | `FK` | → users.id (self) |
| `status` | `varchar(20)` |  | default 'active'; active/invited/suspended |
| `timezone` | `varchar(50)` |  | default 'Europe/Istanbul' |
| `locale` | `varchar(10)` |  | default 'tr-TR' |
| `last_login_at` | `timestamptz` |  |  |
| `display_prefs` | `jsonb` |  |  |
| `created_by` | `uuid` | `FK` `YENİ` | → users.id — genel revizyonda eklendi (audit/hesap verebilirlik) |
| `updated_by` | `uuid` | `FK` `YENİ` | → users.id — genel revizyonda eklendi |
| `created_at` | `timestamptz` |  | default now() |
| `updated_at` | `timestamptz` |  | default now() |

### İndeksler

- `(tenant_id, email) — UNIQUE`
- `(tenant_id, department_id)`
- `(tenant_id, manager_id)`

<CopyCodeButton code={"CREATE TABLE users (\n  id uuid PRIMARY KEY,\n  tenant_id uuid NOT NULL REFERENCES tenants(id),  -- → tenants.id\n  first_name varchar(150) NOT NULL,\n  last_name varchar(150) NOT NULL,\n  email varchar(255) NOT NULL,\n  phone varchar(50),\n  avatar_url text,\n  job_title varchar(150),\n  department_id uuid REFERENCES departments(id),   -- → departments.id\n  job_level_id uuid REFERENCES job_levels(id),     -- → job_levels.id\n  role_id uuid REFERENCES roles(id),               -- → roles.id\n  manager_id uuid REFERENCES users(id),            -- → users.id (self)\n  status varchar(20) DEFAULT 'active',             -- default 'active'; active/invited/suspended\n  timezone varchar(50) DEFAULT 'Europe/Istanbul',  -- default 'Europe/Istanbul'\n  locale varchar(10) DEFAULT 'tr-TR',              -- default 'tr-TR'\n  last_login_at timestamptz,\n  display_prefs jsonb,\n  created_by uuid REFERENCES users(id),            -- → users.id — genel revizyonda eklendi (audit/hesap verebilirlik)\n  updated_by uuid REFERENCES users(id),            -- → users.id — genel revizyonda eklendi\n  created_at timestamptz DEFAULT now(),            -- default now()\n  updated_at timestamptz DEFAULT now()             -- default now()\n);\n\nCREATE UNIQUE INDEX idx_users_1 ON users (tenant_id, email);\nCREATE INDEX idx_users_2 ON users (tenant_id, department_id);\nCREATE INDEX idx_users_3 ON users (tenant_id, manager_id);"} label="📋 CREATE TABLE SQL'ini Kopyala" />
