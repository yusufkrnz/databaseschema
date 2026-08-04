---
sidebar_position: 3
title: ai_message_buckets
why: ["Bir AI konuşması teorik olarak sınırsız mesaj içerebilir (power-user oturumları 500+ mesaja çıkabilir). Bunu tek belgede düz bir diziye gömmek, belgeyi MongoDB'nin 16MB BSON limitine yaklaştırır ve her yeni mesajda tüm belgenin yeniden yazılma/taşınma riskini artırır.","Bucket Pattern ile her belge sabit üst sınırlı kalır (≤50 mesaj); yeni mesaj çoğunlukla sadece açık olan son bucket'a `$push` ile eklenir — sabit boyutlu belgeler WiredTiger için daha öngörülebilir sayfalama sağlar.","'Son N mesajı getir' sorgusu (en sık kullanılan ekran) = sadece son bucket'ı çek. 'Tüm geçmişi getir' = conversation_id'ye göre bucket_seq sırasıyla tüm bucket'ları çek — ikisi de JOIN gerektirmez."]
---

import CopyCodeButton from '@site/src/components/CopyCodeButton';

# ai_message_buckets

`MONGODB` · EMBED + BUCKET — sabit üst sınırlı gruplar halinde gömülü diziler

Bir konuşmanın mesajlarını, tool_call ve ui_widget'larıyla birlikte gömen ama SINIRSIZ büyümesini engelleyen koleksiyon. Her belge en fazla 50 mesaj taşır — dolunca yeni bir bucket (bucket_seq: 0, 1, 2…) açılır. Bu, MongoDB'nin bilinen **Bucket Pattern** desenidir; sohbet/zaman-serisi verisinde düz (sınırsız) embedding'in yerini alır.

_"Neden bu şekilde tasarlandı" gerekçeleri sağdaki (mobilde başlığın altındaki) bilgi kartında._

<CopyCodeButton code={"// ai_message_buckets — mongosh seed script (otomatik üretildi, elle düzenlemeyin)\ndb.createCollection(\"ai_message_buckets\", {\n  validator: {\n    $jsonSchema: {\n      bsonType: \"object\",\n      required: [\"conversation_id\", \"tenant_id\", \"bucket_seq\", \"messages\"],\n      properties: {\n        conversation_id: { bsonType: \"string\" },\n        tenant_id:       { bsonType: \"string\" },\n        bucket_seq:      { bsonType: \"int\", minimum: 0 },\n        messages: {\n          bsonType: \"array\",\n          maxItems: 50,\n          items: {\n            bsonType: \"object\",\n            required: [\"seq\", \"sender_type\", \"created_at\"],\n            properties: {\n              seq: { bsonType: \"int\" },\n              sender_type: { enum: [\"user\", \"assistant\", \"system\"] }\n            }\n          }\n        }\n      }\n    }\n  },\n  validationLevel: \"moderate\"\n});\n\ndb.ai_message_buckets.insertOne({\n  \"_id\": ObjectId(\"66a2201...\"),\n  \"conversation_id\": \"b7e2f900-...-uuid\",\n  \"tenant_id\": \"8f3c1a20-...-uuid\",\n  \"bucket_seq\": 0,\n  \"first_seq\": 1,\n  \"last_seq\": 2,\n  \"message_count\": 2,\n  \"messages\": [\n    {\n      \"seq\": 1,\n      \"sender_type\": \"user\",\n      \"content\": \"Bu ay kapanan deal'ları listele\",\n      \"created_at\": ISODate(\"2026-08-01T09:12:00Z\")\n    },\n    {\n      \"seq\": 2,\n      \"sender_type\": \"assistant\",\n      \"content\": \"İşte bu ay kapanan 7 deal:\",\n      \"created_at\": ISODate(\"2026-08-01T09:12:04Z\"),\n      \"tool_calls\": [\n        {\n          \"tool_name\": \"get_deals\",\n          \"input_params\": { \"status\": \"won\", \"month\": \"2026-08\" },\n          \"output_result\": { \"count\": 7, \"total_amount\": 412500 },\n          \"executed_at\": ISODate(\"2026-08-01T09:12:03Z\")\n        }\n      ],\n      \"ui_widgets\": [\n        {\n          \"widget_type\": \"deal_table\",\n          \"widget_payload\": { \"columns\": [\"title\", \"amount\", \"owner\"], \"row_count\": 7 }\n        }\n      ]\n    }\n  ]\n});"} label="📋 Seed Script'ini Kopyala (mongosh)" />

Kopyaladığınızı Compass'ın veya Atlas Data Explorer'ın gömülü mongosh kabuğuna yapıştırın — koleksiyon, validasyon kuralları ve örnek belgeyle birlikte anında oluşur.

## Alan Şeması (beklenen — zorunlu değil)

| Alan | Tip | Kısıtlar | Not |
|---|---|---|---|
| `_id` | `ObjectId` |  |  |
| `conversation_id` | `string (uuid)` |  | → Postgres ai_conversations.id (app-level referans) |
| `tenant_id` | `string (uuid)` |  |  |
| `bucket_seq` | `int` |  | 0'dan başlar, her yeni bucket +1 |
| `first_seq` | `int` |  | bu bucket'taki ilk mesajın global sırası |
| `last_seq` | `int` |  | bu bucket'taki son mesajın global sırası |
| `message_count` | `int` |  | ≤ 50, dolunca yeni bucket açılır |
| `messages` | `array<object>` |  | gömülü dizi — bkz. örnek belge; her mesaj seq, sender_type, content, opsiyonel tool_calls[] ve ui_widgets[] taşır |

## Örnek Belge

```json
{
  "_id": ObjectId("66a2201..."),
  "conversation_id": "b7e2f900-...-uuid",
  "tenant_id": "8f3c1a20-...-uuid",
  "bucket_seq": 0,
  "first_seq": 1,
  "last_seq": 2,
  "message_count": 2,
  "messages": [
    {
      "seq": 1,
      "sender_type": "user",
      "content": "Bu ay kapanan deal'ları listele",
      "created_at": ISODate("2026-08-01T09:12:00Z")
    },
    {
      "seq": 2,
      "sender_type": "assistant",
      "content": "İşte bu ay kapanan 7 deal:",
      "created_at": ISODate("2026-08-01T09:12:04Z"),
      "tool_calls": [
        {
          "tool_name": "get_deals",
          "input_params": { "status": "won", "month": "2026-08" },
          "output_result": { "count": 7, "total_amount": 412500 },
          "executed_at": ISODate("2026-08-01T09:12:03Z")
        }
      ],
      "ui_widgets": [
        {
          "widget_type": "deal_table",
          "widget_payload": { "columns": ["title", "amount", "owner"], "row_count": 7 }
        }
      ]
    }
  ]
}
```

## JSON Schema Validasyonu

```js
db.createCollection("ai_message_buckets", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["conversation_id", "tenant_id", "bucket_seq", "messages"],
      properties: {
        conversation_id: { bsonType: "string" },
        tenant_id:       { bsonType: "string" },
        bucket_seq:      { bsonType: "int", minimum: 0 },
        messages: {
          bsonType: "array",
          maxItems: 50,
          items: {
            bsonType: "object",
            required: ["seq", "sender_type", "created_at"],
            properties: {
              seq: { bsonType: "int" },
              sender_type: { enum: ["user", "assistant", "system"] }
            }
          }
        }
      }
    }
  },
  validationLevel: "moderate"
});
```

## Önerilen İndeksler

- `{ conversation_id: 1, bucket_seq: 1 }  — UNIQUE, bucket'ları sırayla okumak için`
- `{ tenant_id: 1, conversation_id: 1 }  — tenant izolasyonu + hızlı erişim`

## Örnek Sorgular

### Bir konuşmanın son bucket'ını getir (ekranda gösterilecek son mesajlar)

```js
db.ai_message_buckets.find(
  { conversation_id: conversationId }
).sort({ bucket_seq: -1 }).limit(1);
```

### Tüm konuşma geçmişini sırayla getir

```js
db.ai_message_buckets.find(
  { conversation_id: conversationId }
).sort({ bucket_seq: 1 });
```
