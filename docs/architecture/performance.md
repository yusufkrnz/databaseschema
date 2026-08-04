---
sidebar_position: 3
title: Performans & Ölçekleme
---

# Performans & Ölçekleme

## 1. Bucket Pattern — sınırsız diziden kaçınma

`ai_message_buckets`, bir konuşmanın tüm mesajlarını tek belgede sınırsız bir diziye gömmek yerine sabit üst sınırlı (≤50 mesaj) bucket'lara bölüyor — hem MongoDB'nin 16MB BSON belge limitine hem de büyük belgelerin sürekli yeniden yazılma maliyetine karşı önlem. "Son N mesajı getir" = sadece son bucket; "tüm geçmişi getir" = bucket'ları sırayla çek — ikisi de JOIN gerektirmiyor.

→ Detaylar: [MongoDB Modelleme İlkeleri](/mongodb/principles) · [ai_message_buckets](/mongodb/ai-message-buckets)

## 2. Sharding key = tenant_id

Yüksek hacimli 4 Mongo koleksiyonunun (`audit_log`, `activities`, `custom_field_values`, `llm_call_log`) hepsinde shard key adayı `{ tenant_id: hashed }`. Böylece büyük/gürültülü bir tenant'ın veri hacmi, diğer tenant'ların sorgu performansını etkilemez — çok kiracılı bir sistemde en doğal bölme ekseni tenant sınırının kendisi.

## 3. Wildcard index — dinamik alanlar için

`custom_field_values.values` alanı tenant'a göre değişen serbest anahtarlar taşıyor. Her yeni custom field için manuel index eklemek yerine `{ "values.$**": 1 }` wildcard index'i, hangi alan eklenirse eklensin otomatik olarak sorgulanabilir/indekslenebilir kılıyor.

→ Detaylar: [custom_field_values](/mongodb/custom-field-values)

## 4. Postgres tarafında composite index disiplini

Her tenant-scoped Postgres tablosunda en az bir `(tenant_id, …)` composite index var — tek başına `tenant_id` değil, en sık filtrelenen ikinci alanla birlikte (örn. `deals`'te `(tenant_id, owner_id, status)`, `tasks`'te `(tenant_id, assigned_to, status)`). Bu, "bu tenant'ın açık deal'ları" gibi sorguların sequential scan'e düşmesini engelliyor.

→ Detaylar: [PostgreSQL İlişki Diyagramı](/postgres/erd)

## Açık Konular

:::warning Henüz çözülmedi
- Tek bir MongoDB replica set'ten sharded cluster'a ne zaman geçilmeli — henüz bir eşik (tenant sayısı / veri hacmi) tanımlanmadı.
- `llm_call_log` çok yüksek yazma hacmine çıkarsa (her istekte 2+ çağrı), TTL index ile eski kayıtları ne zaman süpüreceğimiz (audit_log'daki gibi) henüz kararlaştırılmadı.
:::
