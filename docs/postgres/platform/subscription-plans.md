---
sidebar_position: 7
title: subscription_plans
why: ["Paket tanımı tek yerde — kota/fiyat değişikliğinde tüm tenant satırlarını değil sadece bu tabloyu güncelleriz."]
---

import CopyCodeButton from '@site/src/components/CopyCodeButton';

# subscription_plans

`POSTGRESQL` · Platform & Yetkilendirme

Paket/plan tanımı — Starter/Growth/Scale gibi. `tenants.plan_id` buraya işaret eder.

_"Neden bu şekilde tasarlandı" gerekçeleri sağdaki (mobilde başlığın altındaki) bilgi kartında._

## Alanlar

| Alan | Tip | Kısıtlar | Not |
|---|---|---|---|
| `id` | `uuid` | `PK` |  |
| `name` | `varchar(100)` | `NOT NULL` | Starter / Growth / Scale |
| `monthly_token_quota` | `bigint` | `NOT NULL` |  |
| `price_amount` | `numeric(10,2)` |  |  |
| `price_currency` | `varchar(10)` |  | default 'USD' |
| `is_active` | `boolean` |  | default true |
| `created_by` | `uuid` | `FK` `YENİ` | → users.id — genel revizyonda eklendi (audit/hesap verebilirlik) |

<CopyCodeButton code={"CREATE TABLE subscription_plans (\n  id uuid PRIMARY KEY,\n  name varchar(100) NOT NULL,                -- Starter / Growth / Scale\n  monthly_token_quota bigint NOT NULL,\n  price_amount numeric(10,2),\n  price_currency varchar(10) DEFAULT 'USD',  -- default 'USD'\n  is_active boolean DEFAULT true,            -- default true\n  created_by uuid REFERENCES users(id)       -- → users.id — genel revizyonda eklendi (audit/hesap verebilirlik)\n);"} label="📋 CREATE TABLE SQL'ini Kopyala" />
