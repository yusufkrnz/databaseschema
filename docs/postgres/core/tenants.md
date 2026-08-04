---
sidebar_position: 1
title: tenants
why: ["Engellenen edge case — plan yeniden adlandırılınca kotanın sessizce kopması: eğer kota sadece plan varchar'ındaki metne (örn. 'growth') bakarak subscription_plans'ta isimle eşleştirilseydi, pazarlama planı 'Growth' → 'Scale Up' diye yeniden adlandırdığında ya da iki plan birbirine yakın isimli olduğunda eşleştirme hatasız ama YANLIŞ sonuç verirdi — hiçbir hata fırlatmadan yanlış kotayı uygulardı. plan_id somut bir FK olduğu için isim değişse de id sabit kalır, eşleştirme hiç bozulmaz."]
---

import CopyCodeButton from '@site/src/components/CopyCodeButton';

# tenants

`POSTGRESQL` · Core — Multi-tenant Çekirdek

SaaS'ı satın alan gerçek firma. Tüm tenant'a bağlı tablolar buradan türer; multi-tenant izolasyonun kök kaydı.

_"Neden bu şekilde tasarlandı" gerekçeleri sağdaki (mobilde başlığın altındaki) bilgi kartında._

## Alanlar

| Alan | Tip | Kısıtlar | Not |
|---|---|---|---|
| `id` | `uuid` | `PK` | default gen_random_uuid() |
| `legal_name` | `varchar(255)` | `NOT NULL` | resmi unvan |
| `display_name` | `varchar(150)` |  |  |
| `tax_number` | `varchar(50)` |  |  |
| `tax_office` | `varchar(150)` |  |  |
| `sector` | `varchar(100)` |  | AI event havuzunda (bkz. Mongo → ui_generation_events) şablon çıkarımı için de kullanılır |
| `company_size` | `varchar(20)` |  | 1-10 / 11-50 / 51-200 / 200+ |
| `logo_url` | `text` |  |  |
| `billing_email` | `varchar(255)` |  |  |
| `contact_email` | `varchar(255)` |  |  |
| `contact_phone` | `varchar(50)` |  |  |
| `country` | `varchar(100)` |  |  |
| `city` | `varchar(100)` |  |  |
| `subdomain` | `varchar(100)` | `UNIQUE` `NOT NULL` |  |
| `plan` | `varchar(50)` |  | default 'trial'; hızlı gösterim için — asıl kaynak plan_id |
| `plan_id` | `uuid` | `FK` `YENİ` | → subscription_plans.id, eksikti — eklendi |
| `modules_enabled` | `jsonb` |  |  |
| `settings` | `jsonb` |  |  |
| `is_active` | `boolean` |  | default true |
| `trial_ends_at` | `timestamptz` |  |  |
| `created_at` | `timestamptz` |  | default now() |
| `updated_at` | `timestamptz` |  | default now() |

### İndeksler

- `subdomain — UNIQUE`

<CopyCodeButton code={"CREATE TABLE tenants (\n  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),   -- default gen_random_uuid()\n  legal_name varchar(255) NOT NULL,                -- resmi unvan\n  display_name varchar(150),\n  tax_number varchar(50),\n  tax_office varchar(150),\n  sector varchar(100),                             -- AI event havuzunda (bkz. Mongo → ui_generation_events) şablon çıkarımı için de kullanılır\n  company_size varchar(20),                        -- 1-10 / 11-50 / 51-200 / 200+\n  logo_url text,\n  billing_email varchar(255),\n  contact_email varchar(255),\n  contact_phone varchar(50),\n  country varchar(100),\n  city varchar(100),\n  subdomain varchar(100) NOT NULL UNIQUE,\n  plan varchar(50) DEFAULT 'trial',                -- default 'trial'; hızlı gösterim için — asıl kaynak plan_id\n  plan_id uuid REFERENCES subscription_plans(id),  -- → subscription_plans.id, eksikti — eklendi\n  modules_enabled jsonb,\n  settings jsonb,\n  is_active boolean DEFAULT true,                  -- default true\n  trial_ends_at timestamptz,\n  created_at timestamptz DEFAULT now(),            -- default now()\n  updated_at timestamptz DEFAULT now()             -- default now()\n);\n\nCREATE UNIQUE INDEX idx_tenants_1 ON tenants subdomain;"} label="📋 CREATE TABLE SQL'ini Kopyala" />

## Örnek Satır (JSON gösterimi)

```json
{
  "id": "8f3c…",
  "legal_name": "Nova Teknoloji A.Ş.",
  "display_name": "Nova",
  "subdomain": "nova",
  "plan": "growth",
  "is_active": true
}
```
