---
sidebar_position: 4
title: audit_log
why: ["changes alanı entity_type'a göre tamamen farklı şekiller alır — şema zaten esnek olmak zorunda.","Neredeyse hiç UPDATE yok, sadece INSERT ve zaman zaman range sorgusu — Mongo'nun rahat ettiği yazma deseni.","Shard key adayı: `{ tenant_id: hashed }` — büyük/gürültülü bir tenant'ın audit hacmi diğer tenant'ların sorgu performansını etkilemez.","TTL index ile eski kayıtları otomatik süpürmek (örn. 2 yıl sonra) tek satırlık bir index tanımından ibaret."]
---

import CopyCodeButton from '@site/src/components/CopyCodeButton';

# audit_log

`MONGODB` · REFERENCE / APPEND-ONLY — birebir taşıma, TTL ile kendi kendini temizler

Postgres'teki `audit_log` tablosunun yerini tamamen alan koleksiyon. Gerekçe: append-only, çok yüksek yazma hacmi, `changes` alanı zaten serbest yapı — Postgres'te bu tablo büyüdükçe index bakımı ve vacuum maliyeti artar; Mongo'da hem TTL index ile otomatik temizlenebilir hem de tenant bazlı sharding'e daha uygundur.

_"Neden bu şekilde tasarlandı" gerekçeleri sağdaki (mobilde başlığın altındaki) bilgi kartında._

<CopyCodeButton code={"// audit_log — mongosh seed script (otomatik üretildi, elle düzenlemeyin)\ndb.createCollection(\"audit_log\", {\n  validator: {\n    $jsonSchema: {\n      bsonType: \"object\",\n      required: [\"tenant_id\", \"action\", \"entity_type\", \"entity_id\", \"created_at\"],\n      properties: {\n        action: { enum: [\"create\", \"update\", \"delete\"] },\n        entity_type: { bsonType: \"string\" }\n      }\n    }\n  },\n  validationLevel: \"moderate\"\n});\n\ndb.audit_log.insertOne({\n  \"_id\": ObjectId(\"66a201...\"),\n  \"tenant_id\": \"8f3c1a20-...-uuid\",\n  \"user_id\": \"2b77e410-...-uuid\",\n  \"action\": \"update\",\n  \"entity_type\": \"deal\",\n  \"entity_id\": \"b910af33-...-uuid\",\n  \"changes\": {\n    \"stage_id\": { \"from\": \"stg_proposal\", \"to\": \"stg_won\" },\n    \"amount\":   { \"from\": 38000, \"to\": 42000 }\n  },\n  \"created_at\": ISODate(\"2026-08-01T14:03:22Z\")\n});"} label="📋 Seed Script'ini Kopyala (mongosh)" />

Kopyaladığınızı Compass'ın veya Atlas Data Explorer'ın gömülü mongosh kabuğuna yapıştırın — koleksiyon, validasyon kuralları ve örnek belgeyle birlikte anında oluşur.

## Alan Şeması (beklenen — zorunlu değil)

| Alan | Tip | Kısıtlar | Not |
|---|---|---|---|
| `_id` | `ObjectId` |  |  |
| `tenant_id` | `string (uuid)` |  |  |
| `user_id` | `string (uuid) \| null` |  |  |
| `action` | `string` |  | create/update/delete |
| `entity_type` | `string` |  |  |
| `entity_id` | `string (uuid)` |  |  |
| `changes` | `object` |  | serbest yapı, entity_type'a göre değişir |
| `created_at` | `date` |  |  |

## Örnek Belge

```json
{
  "_id": ObjectId("66a201..."),
  "tenant_id": "8f3c1a20-...-uuid",
  "user_id": "2b77e410-...-uuid",
  "action": "update",
  "entity_type": "deal",
  "entity_id": "b910af33-...-uuid",
  "changes": {
    "stage_id": { "from": "stg_proposal", "to": "stg_won" },
    "amount":   { "from": 38000, "to": 42000 }
  },
  "created_at": ISODate("2026-08-01T14:03:22Z")
}
```

## JSON Schema Validasyonu

```js
db.createCollection("audit_log", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["tenant_id", "action", "entity_type", "entity_id", "created_at"],
      properties: {
        action: { enum: ["create", "update", "delete"] },
        entity_type: { bsonType: "string" }
      }
    }
  },
  validationLevel: "moderate"
});
```

## Önerilen İndeksler

- `{ tenant_id: 1, entity_type: 1, entity_id: 1 }  — 'bu kaydın geçmişi' sorgusu`
- `{ created_at: 1 }, expireAfterSeconds: 63072000  — TTL index, 2 yıl sonra otomatik silme`

## Örnek Sorgular

### Bir kaydın (örn. bir deal) tüm değişiklik geçmişi, en yeni önce

```js
db.audit_log.find(
  { tenant_id: tenantId, entity_type: "deal", entity_id: dealId }
).sort({ created_at: -1 });
```

### Bu ay en çok değişen 5 entity_type (aggregate)

```js
db.audit_log.aggregate([
  { $match: { tenant_id: tenantId, created_at: { $gte: startOfMonth } } },
  { $group: { _id: "$entity_type", changeCount: { $sum: 1 } } },
  { $sort: { changeCount: -1 } },
  { $limit: 5 },
]);
```
