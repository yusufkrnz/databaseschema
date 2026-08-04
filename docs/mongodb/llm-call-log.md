---
sidebar_position: 7
title: llm_call_log
why: ["Her istek 2+ LLM çağrısı üretebiliyor (mini LLM + ana LLM + tool call'lar) — bu hacimde bir logu Postgres'te tutmak index/vacuum maliyetini gereksiz artırır, tıpkı audit_log'daki gerekçeyle aynı.","purpose alanına göre kayıt şekli hafifçe değişir (örn. tool_call'da tool_name olur, ui_generation'da seçilen component olur) — şema zaten esnek olmak zorunda.","Engellenen edge case — yanlış faturalama/açıklanamayan maliyet farkı: status alanı olmadan başarısız/timeout olan çağrılar da tenant_token_usage'a yansırdı — tenant hiç kullanmadığı token için kesinti görüp haklı olarak itiraz ederdi. was_fallback olmadan da 'bu ay neden daha pahalı' sorusuna cevap veremezdik (fallback modeli genelde farklı fiyatlanır).","Engellenen edge case — fiyat değişince geçmiş maliyetin bozulması: cost_usd, o çağrı anında model_pricing'den (Postgres) okunan fiyatla hesaplanıp burada donmuş (frozen) olarak saklanır — fiyat sonradan değişse bile geçmiş kayıt yeniden hesaplanmış gibi görünmez.","model_id, ham Bedrock string'i yerine Postgres models.id'sine referans veriyor — sağlayıcı model ismini değiştirirse (versiyon güncellemesi vb.) burada milyonlarca satırı geriye dönük güncellemek gerekmez, tek nokta (models tablosu) güncellenir."]
---

import CopyCodeButton from '@site/src/components/CopyCodeButton';

# llm_call_log

`MONGODB` · APPEND-ONLY — yüksek hacim, tenant_token_usage'ın ham kaynağı değil paralel logu

Her mini/ana LLM çağrısının ham kaydı — hangi tenant/kullanıcı, hangi amaçla (niyet tespiti / UI üretimi / tool call), hangi Bedrock modeli, kaç token, ne maliyet. `tenant_token_usage` (Postgres) buradan değil, çağrı anında atomic olarak güncellenir — bu koleksiyon sadece detaylı log/analiz için.

_"Neden bu şekilde tasarlandı" gerekçeleri sağdaki (mobilde başlığın altındaki) bilgi kartında._

<CopyCodeButton code={"// llm_call_log — mongosh seed script (otomatik üretildi, elle düzenlemeyin)\ndb.createCollection(\"llm_call_log\", {\n  validator: {\n    $jsonSchema: {\n      bsonType: \"object\",\n      required: [\"tenant_id\", \"purpose\", \"model_id\", \"status\", \"created_at\"],\n      properties: {\n        purpose: { enum: [\"intent_detection\", \"ui_generation\", \"tool_call\"] },\n        status:  { enum: [\"success\", \"failed\", \"timeout\"] }\n      }\n    }\n  },\n  validationLevel: \"moderate\"\n});\n\ndb.llm_call_log.insertOne({\n  \"_id\": ObjectId(\"66a240...\"),\n  \"tenant_id\": \"8f3c1a20-...-uuid\",\n  \"user_id\": \"2b77e410-...-uuid\",\n  \"request_id\": \"req_9f21ab\",\n  \"purpose\": \"ui_generation\",\n  \"model_id\": \"9c2a41e0-...-uuid\",\n  \"was_fallback\": false,\n  \"status\": \"success\",\n  \"input_tokens\": 1840,\n  \"output_tokens\": 420,\n  \"cost_usd\": 0.0182,\n  \"latency_ms\": 1370,\n  \"created_at\": ISODate(\"2026-08-01T09:12:04Z\")\n});"} label="📋 Seed Script'ini Kopyala (mongosh)" />

Kopyaladığınızı Compass'ın veya Atlas Data Explorer'ın gömülü mongosh kabuğuna yapıştırın — koleksiyon, validasyon kuralları ve örnek belgeyle birlikte anında oluşur.

## Alan Şeması (beklenen — zorunlu değil)

| Alan | Tip | Kısıtlar | Not |
|---|---|---|---|
| `_id` | `ObjectId` |  |  |
| `tenant_id` | `string (uuid)` |  |  |
| `user_id` | `string (uuid)` |  |  |
| `request_id` | `string` |  | aynı kullanıcı isteğine ait çağrıları gruplamak için |
| `purpose` | `string` |  | intent_detection / ui_generation / tool_call |
| `model_id` | `string (uuid)` |  | → Postgres models.id — ham Bedrock string'i değil, kendi sabit id'miz (app-level referans) |
| `was_fallback` | `bool` |  | birincil model hata verip fallback'e mi düşüldü |
| `status` | `string` |  | success / failed / timeout |
| `input_tokens` | `int` |  |  |
| `output_tokens` | `int` |  |  |
| `cost_usd` | `decimal` |  | çağrı anındaki fiyatla donmuş (frozen) maliyet |
| `latency_ms` | `int` |  |  |
| `created_at` | `date` |  |  |

## Örnek Belge

```json
{
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
}
```

## JSON Schema Validasyonu

```js
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
```

## Önerilen İndeksler

- `{ tenant_id: 1, created_at: -1 }  — tenant'ın son çağrıları / maliyet raporu`
- `{ request_id: 1 }  — tek bir kullanıcı isteğine ait tüm çağrıları toplama`
- `{ tenant_id: 1, status: 1, created_at: -1 }  — başarısız çağrı analizi`

## Örnek Sorgular

### Bu ay tenant başına toplam maliyet (aggregate) — pre-flight gate'in kaynağı

```js
db.llm_call_log.aggregate([
  { $match: { tenant_id: tenantId, status: "success", created_at: { $gte: startOfMonth } } },
  { $group: {
      _id: "$tenant_id",
      totalCostUsd: { $sum: "$cost_usd" },
      totalInputTokens: { $sum: "$input_tokens" },
      totalOutputTokens: { $sum: "$output_tokens" },
  } },
]);
```

### Başarısız çağrı oranı, amaca göre kırılım

```js
db.llm_call_log.aggregate([
  { $match: { tenant_id: tenantId, created_at: { $gte: startOfMonth } } },
  { $group: {
      _id: { purpose: "$purpose", status: "$status" },
      count: { $sum: 1 },
  } },
]);
```
