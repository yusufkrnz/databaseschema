---
sidebar_position: 2
title: ai_conversations
why: ["Konuşma listesi ekranı (sol panel: 'son konuşmalarım') sadece başlık + son mesaj zamanını okur; mesaj gövdesini her seferinde taşımak bu sorguyu gereksiz yere ağırlaştırır.","message_count ve last_bucket_seq alanları sayesinde uygulama, yeni mesaj eklerken hangi bucket'a yazacağına (ya da yeni bucket mı açacağına) tek bu belgeye bakarak karar verir.","Postgres'teki thin `ai_conversations` tablosuyla birebir aynı id'yi taşır — iki taraf arasındaki tek bağ budur, cross-database FK yoktur."]
---

import CopyCodeButton from '@site/src/components/CopyCodeButton';

# ai_conversations

`MONGODB` · REFERENCE — mesaj gövdesinden ayrık, sabit boyutlu belge

AI konuşmasının Mongo tarafındaki metadata belgesi — sadece liste ekranını beslemek için var, mesaj içeriği taşımaz. Postgres'teki `ai_conversations` ile aynı id'yi paylaşır (uygulama seviyesinde eşleşir, DB seviyesinde FK yoktur).

_"Neden bu şekilde tasarlandı" gerekçeleri sağdaki (mobilde başlığın altındaki) bilgi kartında._

<CopyCodeButton code={"// ai_conversations — mongosh seed script (otomatik üretildi, elle düzenlemeyin)\ndb.createCollection(\"ai_conversations\", {\n  validator: {\n    $jsonSchema: {\n      bsonType: \"object\",\n      required: [\"tenant_id\", \"user_id\", \"started_at\"],\n      properties: {\n        tenant_id: { bsonType: \"string\" },\n        user_id:   { bsonType: \"string\" },\n        is_archived: { bsonType: \"bool\" },\n        message_count: { bsonType: \"int\", minimum: 0 }\n      }\n    }\n  },\n  validationLevel: \"moderate\"\n});\n\ndb.ai_conversations.insertOne({\n  \"_id\": ObjectId(\"66a1f2...\"),\n  \"tenant_id\": \"8f3c1a20-...-uuid\",\n  \"user_id\": \"2b77e410-...-uuid\",\n  \"title\": \"Bu ayki kapanan deal analizi\",\n  \"started_at\": ISODate(\"2026-08-01T09:12:00Z\"),\n  \"last_message_at\": ISODate(\"2026-08-01T09:12:04Z\"),\n  \"is_archived\": false,\n  \"message_count\": 2,\n  \"last_bucket_seq\": 0\n});"} label="📋 Seed Script'ini Kopyala (mongosh)" />

Kopyaladığınızı Compass'ın veya Atlas Data Explorer'ın gömülü mongosh kabuğuna yapıştırın — koleksiyon, validasyon kuralları ve örnek belgeyle birlikte anında oluşur.

## Alan Şeması (beklenen — zorunlu değil)

| Alan | Tip | Kısıtlar | Not |
|---|---|---|---|
| `_id` | `ObjectId` |  |  |
| `tenant_id` | `string (uuid)` |  |  |
| `user_id` | `string (uuid)` |  |  |
| `title` | `string` |  |  |
| `started_at` | `date` |  |  |
| `last_message_at` | `date` |  |  |
| `is_archived` | `bool` |  |  |
| `message_count` | `int` |  |  |
| `last_bucket_seq` | `int` |  | şu anda yazılan açık bucket'ın sırası |

## Örnek Belge

```json
{
  "_id": ObjectId("66a1f2..."),
  "tenant_id": "8f3c1a20-...-uuid",
  "user_id": "2b77e410-...-uuid",
  "title": "Bu ayki kapanan deal analizi",
  "started_at": ISODate("2026-08-01T09:12:00Z"),
  "last_message_at": ISODate("2026-08-01T09:12:04Z"),
  "is_archived": false,
  "message_count": 2,
  "last_bucket_seq": 0
}
```

## JSON Schema Validasyonu

```js
db.createCollection("ai_conversations", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["tenant_id", "user_id", "started_at"],
      properties: {
        tenant_id: { bsonType: "string" },
        user_id:   { bsonType: "string" },
        is_archived: { bsonType: "bool" },
        message_count: { bsonType: "int", minimum: 0 }
      }
    }
  },
  validationLevel: "moderate"
});
```

## Önerilen İndeksler

- `{ tenant_id: 1, user_id: 1, last_message_at: -1 }  — kullanıcının konuşma listesi, en yeni önce`
- `{ tenant_id: 1, is_archived: 1 }  — arşiv filtreleme`

## Örnek Sorgular

### Kullanıcının son 20 konuşmasını getir (arşiv hariç)

```js
db.ai_conversations.find(
  { tenant_id: tenantId, user_id: userId, is_archived: false }
).sort({ last_message_at: -1 }).limit(20);
```

### Bir tenant'ın toplam aktif konuşma sayısı

```js
db.ai_conversations.countDocuments(
  { tenant_id: tenantId, is_archived: false }
);
```
