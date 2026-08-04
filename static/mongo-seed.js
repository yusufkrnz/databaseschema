// Tüm MongoDB koleksiyonlarının seed script'i — otomatik üretildi.
// Kullanım: mongosh'a (Compass/Atlas Data Explorer içindeki kabuk dahil) yapıştırın.

// ai_conversations — mongosh seed script (otomatik üretildi, elle düzenlemeyin)
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

db.ai_conversations.insertOne({
  "_id": ObjectId("66a1f2..."),
  "tenant_id": "8f3c1a20-...-uuid",
  "user_id": "2b77e410-...-uuid",
  "title": "Bu ayki kapanan deal analizi",
  "started_at": ISODate("2026-08-01T09:12:00Z"),
  "last_message_at": ISODate("2026-08-01T09:12:04Z"),
  "is_archived": false,
  "message_count": 2,
  "last_bucket_seq": 0
});

// ai_message_buckets — mongosh seed script (otomatik üretildi, elle düzenlemeyin)
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

db.ai_message_buckets.insertOne({
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
});

// audit_log — mongosh seed script (otomatik üretildi, elle düzenlemeyin)
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

db.audit_log.insertOne({
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
});

// activities — mongosh seed script (otomatik üretildi, elle düzenlemeyin)
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

db.activities.insertOne({
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
});

// custom_field_values — mongosh seed script (otomatik üretildi, elle düzenlemeyin)
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

db.custom_field_values.insertOne({
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
});

// llm_call_log — mongosh seed script (otomatik üretildi, elle düzenlemeyin)
db.createCollection("llm_call_log", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["tenant_id", "purpose", "model_id", "status", "created_at"],
      properties: {
        purpose: { enum: ["intent_detection", "ui_generation", "tool_call"] },
        status:  { enum: ["success", "failed", "timeout"] }
      }
    }
  },
  validationLevel: "moderate"
});

db.llm_call_log.insertOne({
  "_id": ObjectId("66a240..."),
  "tenant_id": "8f3c1a20-...-uuid",
  "user_id": "2b77e410-...-uuid",
  "request_id": "req_9f21ab",
  "purpose": "ui_generation",
  "model_id": "9c2a41e0-...-uuid",
  "was_fallback": false,
  "status": "success",
  "input_tokens": 1840,
  "output_tokens": 420,
  "cost_usd": 0.0182,
  "latency_ms": 1370,
  "created_at": ISODate("2026-08-01T09:12:04Z")
});