---
sidebar_position: 11
title: model_pricing
why: ["Engellenen edge case — geçmiş raporların yanlış yeniden hesaplanması: fiyat tek bir alanda (örn. llm_model_routing.price) tutulsaydı, Bedrock fiyat değiştirdiğinde geçmiş ayların maliyet raporu da YENİ fiyatla yeniden hesaplanmış gibi görünürdü. effective_date'li ayrı tablo, o tarihte geçerli fiyatı sabitliyor.","llm_call_log (Mongo) her çağrıda gerçek maliyeti bu tablodan o anki fiyatla hesaplayıp kendi içine donmuş (frozen) olarak yazar — fiyat sonradan değişse bile geçmiş kayıt bozulmaz."]
---

import CopyCodeButton from '@site/src/components/CopyCodeButton';

# model_pricing

`POSTGRESQL` · Platform & Yetkilendirme

Model fiyatlandırması, tarihe bağlı (effective-dated).

_"Neden bu şekilde tasarlandı" gerekçeleri sağdaki (mobilde başlığın altındaki) bilgi kartında._

## Alanlar

| Alan | Tip | Kısıtlar | Not |
|---|---|---|---|
| `id` | `uuid` | `PK` |  |
| `model_id` | `uuid` | `FK` `NOT NULL` | → models.id — önceden ham Bedrock string'iydi, düzeltildi |
| `input_price_per_1k` | `numeric(10,6)` | `NOT NULL` |  |
| `output_price_per_1k` | `numeric(10,6)` | `NOT NULL` |  |
| `effective_date` | `date` | `NOT NULL` |  |
| `created_by` | `uuid` | `FK` `YENİ` | → users.id — genel revizyonda eklendi (audit/hesap verebilirlik) |
| `created_at` | `timestamptz` |  | default now() |

### İndeksler

- `(model_id, effective_date)`

<CopyCodeButton code={"CREATE TABLE model_pricing (\n  id uuid PRIMARY KEY,\n  model_id uuid NOT NULL REFERENCES models(id),  -- → models.id — önceden ham Bedrock string'iydi, düzeltildi\n  input_price_per_1k numeric(10,6) NOT NULL,\n  output_price_per_1k numeric(10,6) NOT NULL,\n  effective_date date NOT NULL,\n  created_by uuid REFERENCES users(id),          -- → users.id — genel revizyonda eklendi (audit/hesap verebilirlik)\n  created_at timestamptz DEFAULT now()           -- default now()\n);\n\nCREATE INDEX idx_model_pricing_1 ON model_pricing (model_id, effective_date);"} label="📋 CREATE TABLE SQL'ini Kopyala" />
