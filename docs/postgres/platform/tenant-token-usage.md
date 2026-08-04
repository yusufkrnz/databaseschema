---
sidebar_position: 8
title: tenant_token_usage
why: ["Engellenen edge case — çifte harcama/race condition: LLM cevabı gelmeden gerçek token sayısı bilinmiyor. reserved_tokens olmasaydı, kotasının sınırında olan bir tenant'ın aynı anda attığı 5 istek hepsi 'kabaca yeterli' görüp geçerdi ve toplamda kotayı fena aşardı. Çözüm: önce tahminle rezerve et (reserved_tokens), cevap gelince gerçek sayıyla düzelt (actual_tokens).","Engellenen edge case — bir kullanıcının tüm firma kotasını tek başına tüketmesi: department_id nullable bırakıldı, MVP'de tenant geneli tek ortak havuz ama departments.token_limit_monthly doldurulunca departman bazlı üst sınır şema değişikliği gerekmeden açılabilir.","Engellenen edge case — ay ortası plan yükseltmesinde geçmişin bozulması: quota_limit dönem bazlı satırda tutuluyor, bu sayede bir tenant ayın 15'inde paket yükseltirse geçmiş dönemlerin kotası geriye dönük değişmiyor."]
---

import CopyCodeButton from '@site/src/components/CopyCodeButton';

# tenant_token_usage

`POSTGRESQL` · Platform & Yetkilendirme

Tenant başına dönemsel token sayacı — mini/ana LLM'e gitmeden ÖNCE kontrol edilen, hot-path'teki tek tablo.

_"Neden bu şekilde tasarlandı" gerekçeleri sağdaki (mobilde başlığın altındaki) bilgi kartında._

## Alanlar

| Alan | Tip | Kısıtlar | Not |
|---|---|---|---|
| `id` | `uuid` | `PK` |  |
| `tenant_id` | `uuid` | `FK` `NOT NULL` | → tenants.id |
| `department_id` | `uuid` | `FK` | → departments.id, NULL = tenant geneli ortak havuz |
| `period` | `varchar(7)` | `NOT NULL` | 'YYYY-MM' |
| `reserved_tokens` | `bigint` |  | default 0; LLM çağrısı başlamadan önce tahmini rezervasyon |
| `actual_tokens` | `bigint` |  | default 0; LLM cevabı gelince kesinleşen gerçek miktar |
| `quota_limit` | `bigint` | `NOT NULL` | o dönem için geçerli kota — plan sonradan değişse bile sabit kalır |
| `updated_at` | `timestamptz` |  | default now() |

### İndeksler

- `(tenant_id, period) — UNIQUE`
- `(tenant_id, department_id, period)`

<CopyCodeButton code={"CREATE TABLE tenant_token_usage (\n  id uuid PRIMARY KEY,\n  tenant_id uuid NOT NULL REFERENCES tenants(id),  -- → tenants.id\n  department_id uuid REFERENCES departments(id),   -- → departments.id, NULL = tenant geneli ortak havuz\n  period varchar(7) NOT NULL,                      -- 'YYYY-MM'\n  reserved_tokens bigint DEFAULT 0,                -- default 0; LLM çağrısı başlamadan önce tahmini rezervasyon\n  actual_tokens bigint DEFAULT 0,                  -- default 0; LLM cevabı gelince kesinleşen gerçek miktar\n  quota_limit bigint NOT NULL,                     -- o dönem için geçerli kota — plan sonradan değişse bile sabit kalır\n  updated_at timestamptz DEFAULT now()             -- default now()\n);\n\nCREATE UNIQUE INDEX idx_tenant_token_usage_1 ON tenant_token_usage (tenant_id, period);\nCREATE INDEX idx_tenant_token_usage_2 ON tenant_token_usage (tenant_id, department_id, period);"} label="📋 CREATE TABLE SQL'ini Kopyala" />
