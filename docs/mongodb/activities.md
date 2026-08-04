---
sidebar_position: 5
title: activities
why: ["activity_type'a göre alan seti gerçekten farklılaşıyor (call ≠ email ≠ meeting) — çok sayıda NULL kolon açmak yerine tipe özel gömülü obje (`details`) kullanılıyor.","Timeline görünümü zaten 'bu entity'nin tüm activity'lerini sırayla getir' şeklinde okunuyor — JOIN gerektirmeyen bir erişim deseni, Mongo'nun rahat ettiği yer.","İleride yeni bir activity_type eklemek (örn. 'whatsapp_message') şema migration'ı gerektirmez; details.* içinde yeni bir alan açmak yeterlidir."]
---

import CopyCodeButton from '@site/src/components/CopyCodeButton';

# activities

`MONGODB` · COEXISTENCE — Postgres ile aynı anda değil, ihtiyaç halinde alternatif

Postgres'teki `activities` tablosunun yerini ALMAZ — aynı verinin MongoDB'de nasıl modellenebileceğini gösteren, opsiyonel/alternatif bir model. activity_type'a göre şeklen değişen ek alanlar (`details`) taşıyabilir. Büyük ölçekli veya çok tipli (call/email/whatsapp/meeting…) tenant'lar için değerlendirilir.

_"Neden bu şekilde tasarlandı" gerekçeleri sağdaki (mobilde başlığın altındaki) bilgi kartında._

<CopyCodeButton code={"// activities — mongosh seed script (otomatik üretildi, elle düzenlemeyin)\ndb.createCollection(\"activities\", {\n  validator: {\n    $jsonSchema: {\n      bsonType: \"object\",\n      required: [\"tenant_id\", \"entity_type\", \"entity_id\", \"activity_type\", \"created_at\"],\n      properties: {\n        activity_type: { enum: [\"call\", \"email\", \"note\", \"meeting\"] }\n      }\n    }\n  },\n  validationLevel: \"moderate\"\n});\n\ndb.activities.insertOne({\n  \"_id\": ObjectId(\"66a20e...\"),\n  \"tenant_id\": \"8f3c1a20-...-uuid\",\n  \"entity_type\": \"deal\",\n  \"entity_id\": \"b910af33-...-uuid\",\n  \"activity_type\": \"call\",\n  \"subject\": \"Fiyat görüşmesi\",\n  \"content\": \"Müşteri yıllık plana geçmek istiyor.\",\n  \"created_by\": \"2b77e410-...-uuid\",\n  \"created_at\": ISODate(\"2026-08-01T11:20:00Z\"),\n  \"details\": {\n    \"duration_minutes\": 18,\n    \"recording_url\": \"https://cdn.internal/calls/abc123.mp3\",\n    \"outcome\": \"follow_up_scheduled\"\n  }\n});"} label="📋 Seed Script'ini Kopyala (mongosh)" />

Kopyaladığınızı Compass'ın veya Atlas Data Explorer'ın gömülü mongosh kabuğuna yapıştırın — koleksiyon, validasyon kuralları ve örnek belgeyle birlikte anında oluşur.

## Alan Şeması (beklenen — zorunlu değil)

| Alan | Tip | Kısıtlar | Not |
|---|---|---|---|
| `_id` | `ObjectId` |  |  |
| `tenant_id` | `string (uuid)` |  |  |
| `entity_type` | `string` |  | örn. 'deal', 'contact' |
| `entity_id` | `string (uuid)` |  |  |
| `activity_type` | `string` |  | call/email/note/meeting |
| `subject` | `string` |  |  |
| `content` | `string` |  |  |
| `created_by` | `string (uuid)` |  |  |
| `created_at` | `date` |  |  |
| `details` | `object` |  | activity_type'a göre değişen serbest alanlar |

## Örnek Belge

```json
{
  "_id": ObjectId("66a20e..."),
  "tenant_id": "8f3c1a20-...-uuid",
  "entity_type": "deal",
  "entity_id": "b910af33-...-uuid",
  "activity_type": "call",
  "subject": "Fiyat görüşmesi",
  "content": "Müşteri yıllık plana geçmek istiyor.",
  "created_by": "2b77e410-...-uuid",
  "created_at": ISODate("2026-08-01T11:20:00Z"),
  "details": {
    "duration_minutes": 18,
    "recording_url": "https://cdn.internal/calls/abc123.mp3",
    "outcome": "follow_up_scheduled"
  }
}
```

## JSON Schema Validasyonu

```js
db.createCollection("activities", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["tenant_id", "entity_type", "entity_id", "activity_type", "created_at"],
      properties: {
        activity_type: { enum: ["call", "email", "note", "meeting"] }
      }
    }
  },
  validationLevel: "moderate"
});
```

## Önerilen İndeksler

- `{ tenant_id: 1, entity_type: 1, entity_id: 1, created_at: -1 }  — bir kaydın timeline'ı, en yeni önce`

## Örnek Sorgular

### Bir contact'ın timeline'ı, en yeni önce

```js
db.activities.find(
  { tenant_id: tenantId, entity_type: "contact", entity_id: contactId }
).sort({ created_at: -1 });
```

### activity_type dağılımı (aggregate)

```js
db.activities.aggregate([
  { $match: { tenant_id: tenantId } },
  { $group: { _id: "$activity_type", count: { $sum: 1 } } },
  { $sort: { count: -1 } },
]);
```
