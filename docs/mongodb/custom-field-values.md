---
sidebar_position: 6
title: custom_field_values
why: ["Postgres'te custom_fields jsonb kolonu her entity tablosuna ayrı ayrı eklenmiş durumda; burada tek koleksiyonda entity_type ile ayrıştırılıp merkezi yönetiliyor.","Wildcard index (`$**`) sayesinde tenant'lar istediği yeni alanı tanımladığında manuel index eklemeye gerek kalmıyor — Postgres'te sık sorgulanan yeni bir jsonb anahtarı için genelde ayrı bir expression index eklemek gerekir.","Bu koleksiyon opsiyoneldir: küçük/orta ölçekli tenant'lar için Postgres'teki jsonb kolonu yeterlidir. Custom field sayısı ve sorgu çeşitliliği arttıkça bu modele geçiş değerlendirilir."]
---

import CopyCodeButton from '@site/src/components/CopyCodeButton';

# custom_field_values

`MONGODB` · REFERENCE / EAV — merkezi, wildcard-indexli dinamik alan deposu

Postgres'teki `custom_fields` jsonb kolonuna (companies, contacts, deals, projects'e tekrar tekrar eklenmiş) alternatif, merkezi bir EAV modeli. Her entity_type/entity_id çifti için tek belge, `values` altında tenant'ın custom_field_definitions'ta tanımladığı serbest anahtarları taşır.

_"Neden bu şekilde tasarlandı" gerekçeleri sağdaki (mobilde başlığın altındaki) bilgi kartında._

<CopyCodeButton code={"// custom_field_values — mongosh seed script (otomatik üretildi, elle düzenlemeyin)\ndb.createCollection(\"custom_field_values\", {\n  validator: {\n    $jsonSchema: {\n      bsonType: \"object\",\n      required: [\"tenant_id\", \"entity_type\", \"entity_id\", \"values\"],\n      properties: {\n        entity_type: { bsonType: \"string\" },\n        values: { bsonType: \"object\" }\n      }\n    }\n  },\n  validationLevel: \"moderate\"\n});\n\n// values içindeki HERHANGİ bir dinamik alanı otomatik indeksler\ndb.custom_field_values.createIndex({ \"values.$**\": 1 });\n\ndb.custom_field_values.insertOne({\n  \"_id\": ObjectId(\"66a231...\"),\n  \"tenant_id\": \"8f3c1a20-...-uuid\",\n  \"entity_type\": \"deal\",\n  \"entity_id\": \"b910af33-...-uuid\",\n  \"values\": {\n    \"budget_approval_code\": \"BAC-2231\",\n    \"partner_channel\": \"reseller\",\n    \"renewal_risk_score\": 3.5,\n    \"is_strategic_account\": true\n  },\n  \"updated_at\": ISODate(\"2026-08-01T10:00:00Z\")\n});"} label="📋 Seed Script'ini Kopyala (mongosh)" />

Kopyaladığınızı Compass'ın veya Atlas Data Explorer'ın gömülü mongosh kabuğuna yapıştırın — koleksiyon, validasyon kuralları ve örnek belgeyle birlikte anında oluşur.

## Alan Şeması (beklenen — zorunlu değil)

| Alan | Tip | Kısıtlar | Not |
|---|---|---|---|
| `_id` | `ObjectId` |  |  |
| `tenant_id` | `string (uuid)` |  |  |
| `entity_type` | `string` |  | örn. 'deal', 'contact', 'company' |
| `entity_id` | `string (uuid)` |  |  |
| `values` | `object` |  | tenant'a özel dinamik anahtarlar, serbest yapı |
| `updated_at` | `date` |  |  |

## Örnek Belge

```json
{
  "_id": ObjectId("66a231..."),
  "tenant_id": "8f3c1a20-...-uuid",
  "entity_type": "deal",
  "entity_id": "b910af33-...-uuid",
  "values": {
    "budget_approval_code": "BAC-2231",
    "partner_channel": "reseller",
    "renewal_risk_score": 3.5,
    "is_strategic_account": true
  },
  "updated_at": ISODate("2026-08-01T10:00:00Z")
}
```

## JSON Schema Validasyonu

```js
db.createCollection("custom_field_values", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["tenant_id", "entity_type", "entity_id", "values"],
      properties: {
        entity_type: { bsonType: "string" },
        values: { bsonType: "object" }
      }
    }
  },
  validationLevel: "moderate"
});

// values içindeki HERHANGİ bir dinamik alanı otomatik indeksler
db.custom_field_values.createIndex({ "values.$**": 1 });
```

## Önerilen İndeksler

- `{ tenant_id: 1, entity_type: 1, entity_id: 1 }  — UNIQUE, bir kaydın tek belgesi`
- `{ "values.$**": 1 }  — wildcard index, hangi custom field eklenirse eklensin otomatik indekslenir`

## Örnek Sorgular

### Bir deal'in custom field değerlerini getir

```js
db.custom_field_values.findOne(
  { tenant_id: tenantId, entity_type: "deal", entity_id: dealId }
);
```

### Belirli bir dinamik alana göre filtrele (wildcard index kullanır)

```js
db.custom_field_values.find(
  { tenant_id: tenantId, "values.partner_channel": "reseller" }
);
```
