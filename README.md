# Şema Referansı — AI-First CRM + ERP

PostgreSQL (36 tablo) ve MongoDB (6 koleksiyon) için Docusaurus tabanlı şema dokümantasyonu. Canlı: https://yusufkrnz.github.io/databaseschema/

## Geliştirme

```bash
npm install
npm start
```

`http://localhost:3000/databaseschema/` adresinde açılır, dosya değişikliklerinde otomatik yenilenir.

## İçeriği güncelleme

Tablo/koleksiyon içeriğinin **tek kaynağı** `scripts/generate-docs.mjs`. `docs/` altındaki tablo/koleksiyon sayfaları, `schema.dbml` ve `mongo-seed.js` bu script'ten üretilir — o dosyaları elle düzenlemeyin.

```bash
node scripts/generate-docs.mjs
```

`docs/intro.md`, `docs/relationships.md`, `docs/postgres/erd.md`, `docs/mongodb/principles.md` ve `docs/architecture/*` elle yazılır (jeneratörün kapsamı dışında).

## Build

```bash
npm run build
```

Statik çıktı `build/` altına üretilir.

## Yayınlama (GitHub Pages)

```bash
GIT_USER=<github-kullanici-adin> npm run deploy
```

Bu komut siteyi build edip `gh-pages` branch'ine push eder. İlk seferde repo ayarlarından (Settings → Pages) kaynak olarak `gh-pages` branch'inin seçili olduğunu doğrulayın.
