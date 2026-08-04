---
sidebar_position: 2
title: project_members
---

import CopyCodeButton from '@site/src/components/CopyCodeButton';

# project_members

`POSTGRESQL` · ERP / İç Operasyon

Bir projenin üyeleri; user başına rol taşıyan çoktan-çoğa bağlantı tablosu.

## Alanlar

| Alan | Tip | Kısıtlar | Not |
|---|---|---|---|
| `tenant_id` | `uuid` | `FK` `NOT NULL` `YENİ` | → tenants.id — RLS için denormalize edildi, eksikti |
| `project_id` | `uuid` | `PK` `FK` `NOT NULL` | → projects.id |
| `user_id` | `uuid` | `PK` `FK` `NOT NULL` | → users.id |
| `project_role` | `varchar(20)` |  | default 'member' |
| `joined_at` | `timestamptz` |  | default now() |

### İndeksler

- `(project_id, user_id) — PK`
- `(tenant_id, user_id)`

<CopyCodeButton code={"CREATE TABLE project_members (\n  tenant_id uuid NOT NULL REFERENCES tenants(id),  -- → tenants.id — RLS için denormalize edildi, eksikti\n  project_id uuid REFERENCES projects(id),         -- → projects.id\n  user_id uuid REFERENCES users(id),               -- → users.id\n  project_role varchar(20) DEFAULT 'member',       -- default 'member'\n  joined_at timestamptz DEFAULT now(),             -- default now()\n  PRIMARY KEY (project_id, user_id)\n);\n\nCREATE INDEX idx_project_members_1 ON project_members (tenant_id, user_id);"} label="📋 CREATE TABLE SQL'ini Kopyala" />
