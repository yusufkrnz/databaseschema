---
sidebar_position: 14
title: audit_log
why: ["changes alanı entity_type'a göre tamamen farklı şekiller alır — Postgres'te bunu jsonb ile idare etmek yerine Mongo'nun doğal esnekliğine bırakıyoruz.","TTL index ile eski kayıtları otomatik silmek Mongo'da tek satır, Postgres'te ayrı bir cron/partition stratejisi gerektirirdi."]
---

# audit_log

## Neden MongoDB'ye taşındı

:::tip MongoDB'ye taşındı
Bu tablo tamamen MongoDB'ye taşındı. Gerekçe: append-only, çok yüksek yazma hacmi, `changes` alanı zaten serbest yapı (jsonb) — büyüdükçe Postgres'te index bakımı/vacuum maliyeti artıyor, Mongo'da TTL index ile otomatik temizlenebiliyor.

**[audit_log koleksiyonuna git →](/mongodb/audit-log)**
:::
