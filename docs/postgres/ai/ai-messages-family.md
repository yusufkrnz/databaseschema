---
sidebar_position: 2
title: ai_messages, ai_message_tool_calls, ai_message_ui_widgets
why: ["3 ayrı tabloyu JOIN ile birleştirmek yerine, zaten hep birlikte okunan veriyi tek belgede toplamak sorguyu basitleştiriyor.","Bir konuşma sınırsız büyüyebileceği için düz embed yerine Bucket Pattern (≤50 mesaj/belge) kullanıldı — 16MB BSON limitine karşı önlem."]
---

# ai_messages, ai_message_tool_calls, ai_message_ui_widgets

## Neden MongoDB'ye taşındı

:::tip MongoDB'ye taşındı
Bu üç tablo tamamen MongoDB'ye taşındı ve tek bir koleksiyona (`ai_message_buckets`) konsolide edildi. Gerekçe: mesajlar her zaman sırayla ve birlikte okunuyor, nadiren tek başına JOIN ile sorgulanıyor — klasik 'gömme' (embedding) senaryosu. Sınırsız büyüyebilecekleri için düz embed yerine Bucket Pattern kullanıldı (bkz. [MongoDB → Modelleme İlkeleri](/mongodb/principles)).

**[ai_message_buckets koleksiyonuna git →](/mongodb/ai-message-buckets)**
:::
