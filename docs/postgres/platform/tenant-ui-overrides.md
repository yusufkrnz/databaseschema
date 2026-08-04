---
sidebar_position: 6
title: tenant_ui_overrides
why: ["ui_components'in kendisini tenant başına çoğaltmak yerine sadece farkı (override) saklıyoruz — component kataloğu tek, tutarlı kalıyor."]
---

import CopyCodeButton from '@site/src/components/CopyCodeButton';

# tenant_ui_overrides

`POSTGRESQL` · Platform & Yetkilendirme

Firma-özel UI Kataloğu — bir tenant'ın standart bir component'i nasıl özelleştirdiği (renk, varsayılan görünüm).

_"Neden bu şekilde tasarlandı" gerekçeleri sağdaki (mobilde başlığın altındaki) bilgi kartında._

## Alanlar

| Alan | Tip | Kısıtlar | Not |
|---|---|---|---|
| `id` | `uuid` | `PK` |  |
| `tenant_id` | `uuid` | `FK` `NOT NULL` | → tenants.id |
| `base_component_id` | `uuid` | `FK` `NOT NULL` | → ui_components.id |
| `override_config` | `jsonb` |  | renk, logo, varsayılan görünüm tercihi |
| `created_by` | `uuid` | `FK` `YENİ` | → users.id — genel revizyonda eklendi (audit/hesap verebilirlik) |
| `created_at` | `timestamptz` |  | default now() |

### İndeksler

- `(tenant_id, base_component_id)`

<CopyCodeButton code={"CREATE TABLE tenant_ui_overrides (\n  id uuid PRIMARY KEY,\n  tenant_id uuid NOT NULL REFERENCES tenants(id),                -- → tenants.id\n  base_component_id uuid NOT NULL REFERENCES ui_components(id),  -- → ui_components.id\n  override_config jsonb,                                         -- renk, logo, varsayılan görünüm tercihi\n  created_by uuid REFERENCES users(id),                          -- → users.id — genel revizyonda eklendi (audit/hesap verebilirlik)\n  created_at timestamptz DEFAULT now()                           -- default now()\n);\n\nCREATE INDEX idx_tenant_ui_overrides_1 ON tenant_ui_overrides (tenant_id, base_component_id);"} label="📋 CREATE TABLE SQL'ini Kopyala" />
