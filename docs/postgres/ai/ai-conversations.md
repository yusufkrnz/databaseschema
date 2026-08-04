---
sidebar_position: 1
title: ai_conversations
---

import CopyCodeButton from '@site/src/components/CopyCodeButton';

# ai_conversations

`POSTGRESQL` · AI Katalog

AI konuşmasının Postgres tarafındaki ince (thin) kaydı. Mesaj gövdesi burada YOK — tamamen MongoDB'de tutulur (bkz. [MongoDB → ai_message_buckets](/mongodb/ai-message-buckets)). Bu tablo yalnızca tenant/user FK bütünlüğünü ve 'kullanıcının konuşma listesi' gibi hızlı JOIN'li ekranları besler.

## Alanlar

| Alan | Tip | Kısıtlar | Not |
|---|---|---|---|
| `id` | `uuid` | `PK` | Mongo tarafında conversation_id olarak referans alınır (app-level, DB FK değil) |
| `tenant_id` | `uuid` | `FK` `NOT NULL` | → tenants.id |
| `user_id` | `uuid` | `FK` `NOT NULL` | → users.id |
| `title` | `varchar(255)` |  |  |
| `started_at` | `timestamptz` |  | default now() |
| `last_message_at` | `timestamptz` |  |  |
| `is_archived` | `boolean` |  | default false |
| `message_count` | `int` | `YENİ` | Mongo'daki mesaj sayısının senkron kopyası — liste ekranı Mongo'ya gitmeden çalışsın diye |

### İndeksler

- `(tenant_id, user_id, last_message_at)`

<CopyCodeButton code={"CREATE TABLE ai_conversations (\n  id uuid PRIMARY KEY,                             -- Mongo tarafında conversation_id olarak referans alınır (app-level, DB FK değil)\n  tenant_id uuid NOT NULL REFERENCES tenants(id),  -- → tenants.id\n  user_id uuid NOT NULL REFERENCES users(id),      -- → users.id\n  title varchar(255),\n  started_at timestamptz DEFAULT now(),            -- default now()\n  last_message_at timestamptz,\n  is_archived boolean DEFAULT false,               -- default false\n  message_count int                                -- Mongo'daki mesaj sayısının senkron kopyası — liste ekranı Mongo'ya gitmeden çalışsın diye\n);\n\nCREATE INDEX idx_ai_conversations_1 ON ai_conversations (tenant_id, user_id, last_message_at);"} label="📋 CREATE TABLE SQL'ini Kopyala" />
