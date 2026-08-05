---
sidebar_position: 4
title: Güvenilirlik & Tutarlılık
---

# Güvenilirlik & Tutarlılık

Poliglot (Postgres + Mongo) bir mimarinin en çok göz ardı edilen tarafı: iki veritabanı arasında ne kaybediyoruz, bunu nerede telafi ediyoruz.

## 1. Cross-database transaction yok

Bir deal'i Postgres'te güncelleyip aynı anda Mongo'da bir activity oluşturmak **tek bir atomic işlem değil**. İkisi arasında tutarlılık uygulama seviyesinde (retry, outbox pattern) sağlanmalı — DB seviyesinde bir garanti yok.

## 2. Foreign key enforcement yok

Mongo belgelerindeki `tenant_id`, `conversation_id` gibi referanslar veritabanı seviyesinde zorlanmıyor, sadece uygulama kodu ve `$jsonSchema` validasyonu ile korunuyor. `ai_conversations._id` ile `ai_message_buckets.conversation_id` arasındaki bağ bile — ikisi de Mongo'da olsa dahi — bir DB-seviyesi FK değil, sadece uygulama seviyesinde tutarlı tutulan bir referans.

→ Detaylar: [Polyglot Mimari diyagramı](/intro#polyglot-mimari--veri-nereye-yazılır)

## 3. Tenant silme — iki adımlı, eventually consistent

Postgres'te bir tenant silindiğinde CASCADE ile ilişkili satırlar **anında** silinir. Mongo tarafında bu iş arka planda bir temizlik job'ı (tenant_id'ye göre toplu silme) ile yapılmalı — hemen değil, eninde sonunda tutarlı. Bu aradaki pencerede "silinmiş" bir tenant'ın Mongo'da hâlâ verisi olabileceği bilinmeli (özellikle KVKK/"unutulma hakkı" talepleri için önemli).

## 4. Başarısız çağrıların doğru muhasebesi

`llm_call_log.status` (`success` / `failed` / `timeout`) olmadan, başarısız bir LLM çağrısı da `tenant_token_usage`'a yansırdı — tenant hiç kullanmadığı token için kesinti görüp haklı olarak itiraz ederdi. Başarısız çağrılar loglanır ama kota sayacına işlenmez.

→ Detaylar: [llm_call_log](/mongodb/llm-call-log)

## 5. Fallback izlenebilirliği

Birincil Bedrock modeli hata verip `fallback_model_id`'ye düşüldüğünde bu durum (`was_fallback: true`) kayıt altına alınır — aksi halde maliyet/performans raporlarında açıklanamayan sapmalar ortaya çıkar.

## Açık Konular

:::warning Henüz çözülmedi
- Mongo'daki "arka plan temizlik job'ı" (tenant silme sonrası) henüz tasarlanmadı — hangi sıklıkta çalışacak, hata durumunda nasıl retry edecek belirsiz.
- Postgres ↔ Mongo arasında düzenli bir tutarlılık denetimi (örn. "her `companies.id`'ye ait activity kaydı gerçekten var mı") henüz bir mekanizmaya bağlanmadı.
:::
