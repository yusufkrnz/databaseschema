---
sidebar_position: 1
title: permissions
why: ["İzin tanımını (permissions) ve kime verildiğini (role_permissions) ayırmak, aynı izni birden fazla role bağlarken satır çoğaltmadan yönetmemizi sağlıyor.","Engellenen edge case — isim değişince iznin sessizce kopması: ilk revizyonda catalog_item_name (örn. 'BarChart' string'i) kullanılmıştı. Bir component/action/tool yeniden adlandırılırsa (ör. 'BarChart' → 'BarChartV2') isimle eşleşen izin sessizce hiçbir şeye bağlanmaz kalırdı — hata vermeden. catalog_item_id kullanmak, mevcut entity_type/entity_id polimorfik desenimizle de (activities, attachments, tasks) tutarlı hale getirdi: isim değil id üzerinden eşleştiriyoruz."]
---

import CopyCodeButton from '@site/src/components/CopyCodeButton';

# permissions

`POSTGRESQL` · Platform & Yetkilendirme

'Ne verilebilir' kataloğu — role bağlı değil, tek başına bir izin tanımı. `catalog_type` + `catalog_item_id`, `ui_components`/`action_registry`/`tool_registry` tablolarındaki gerçek `id`'yle eşleşir (hangi tabloya bakılacağını catalog_type söyler — DB bunu tek bir FK constraint'iyle zorlayamaz ama en azından eşleşme isim değil id üzerinden, mevcut entity_type/entity_id polimorfik desenimizle tutarlı). Mevcut `roles_permissions` tablosunun YERİNE geçmiyor: roles_permissions veri (deal/contact CRUD) erişimini, bu tablo ise katalog öğesi (UI component/action/tool) erişimini kontrol ediyor — iki farklı katman.

_"Neden bu şekilde tasarlandı" gerekçeleri sağdaki (mobilde başlığın altındaki) bilgi kartında._

## Alanlar

| Alan | Tip | Kısıtlar | Not |
|---|---|---|---|
| `id` | `uuid` | `PK` |  |
| `catalog_type` | `varchar(20)` | `NOT NULL` | 'ui' \| 'function' \| 'tool' — catalog_item_id hangi tabloda aranacak, bunu belirler |
| `catalog_item_id` | `uuid` | `NOT NULL` `YENİ` | → ui_components.id / action_registry.id / tool_registry.id (catalog_type'a göre) — önceden catalog_item_name (isim) idi, düzeltildi |
| `action` | `varchar(20)` |  | default 'execute'; view/execute/write |
| `requires_confirm` | `boolean` |  | default false |
| `is_active` | `boolean` |  | default true |
| `created_by` | `uuid` | `FK` `YENİ` | → users.id — genel revizyonda eklendi (audit/hesap verebilirlik) |
| `created_at` | `timestamptz` |  | default now() |

### İndeksler

- `(catalog_type, catalog_item_id, action) — UNIQUE`

<CopyCodeButton code={"CREATE TABLE permissions (\n  id uuid PRIMARY KEY,\n  catalog_type varchar(20) NOT NULL,       -- 'ui' | 'function' | 'tool' — catalog_item_id hangi tabloda aranacak, bunu belirler\n  catalog_item_id uuid NOT NULL,           -- → ui_components.id / action_registry.id / tool_registry.id (catalog_type'a göre) — önceden catalog_item_name (isim) idi, düzeltildi\n  action varchar(20) DEFAULT 'execute',    -- default 'execute'; view/execute/write\n  requires_confirm boolean DEFAULT false,  -- default false\n  is_active boolean DEFAULT true,          -- default true\n  created_by uuid REFERENCES users(id),    -- → users.id — genel revizyonda eklendi (audit/hesap verebilirlik)\n  created_at timestamptz DEFAULT now()     -- default now()\n);\n\nCREATE UNIQUE INDEX idx_permissions_1 ON permissions (catalog_type, catalog_item_id, action);"} label="📋 CREATE TABLE SQL'ini Kopyala" />
