// Bir kerelik içerik üretici — şema verisinden docs/ altına Markdown üretir.
// Çalıştırma: node scripts/generate-docs.mjs
// Docusaurus içeriği artık docs/*.md dosyalarında yaşıyor; bu betik sadece
// ilk iskeleti doldurmak için kullanıldı, elle düzenlemelerden sonra silinebilir.

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DOCS = join(__dirname, "..", "docs");

function esc(s) {
  return String(s ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function flagBadges(flags) {
  if (!flags || !flags.length) return "";
  const label = { PK: "PK", FK: "FK", UNIQUE: "UNIQUE", NN: "NOT NULL", new: "YENİ" };
  return flags.map((f) => `\`${label[f] || f}\``).join(" ");
}

function fieldsTable(fields) {
  const header = `| Alan | Tip | Kısıtlar | Not |\n|---|---|---|---|`;
  const rows = fields
    .map((f) => `| \`${esc(f.n)}\` | \`${esc(f.t)}\` | ${flagBadges(f.f)} | ${esc(f.no || "")} |`)
    .join("\n");
  return `${header}\n${rows}`;
}

function idxList(idx) {
  if (!idx || !idx.length) return "";
  return `\n### İndeksler\n\n${idx.map((i) => `- \`${i}\``).join("\n")}\n`;
}

// "default 'trial'", "default now()", "default true" gibi sık kalıpları not
// metninden ayıklar. Yakalayamadığı defaultlar kayıp gitmez — tam not metni
// zaten satır sonu yorumu olarak kalıyor.
function extractDefault(note) {
  if (!note) return null;
  const m = note.match(/default\s+(now\(\)|gen_random_uuid\(\)|true|false|'[^']*'|\d+(?:\.\d+)?)/i);
  return m ? m[1] : null;
}

// Tek hedefli "→ tablo.id" notundan REFERENCES çıkarır; birden fazla hedef
// varsa (polimorfik alan) es geçer — DBML export'taki mantığın aynısı.
function extractSingleFkTarget(note) {
  if (!note) return null;
  const matches = [...note.matchAll(/→\s*([a-zA-Z_]+)\.id\b/g)];
  return matches.length === 1 ? matches[0][1].replace(/-/g, "_") : null;
}

function buildCreateTableSql(tbl) {
  const tableName = tbl.id.replace(/-/g, "_");
  const pkFields = tbl.fields.filter((f) => (f.f || []).includes("PK"));
  const isCompositePk = pkFields.length > 1;

  const cols = tbl.fields.map((f) => {
    const flags = f.f || [];
    const parts = [`${f.n} ${f.t}`];
    // Composite PK'de inline PRIMARY KEY yazılamaz (geçersiz SQL) — tablo
    // sonunda tek bir PRIMARY KEY (a, b, c) satırı olarak ekleniyor.
    if (flags.includes("PK") && !isCompositePk) parts.push("PRIMARY KEY");
    const def = extractDefault(f.no);
    if (def) parts.push(`DEFAULT ${def}`);
    if (flags.includes("NN") && !flags.includes("PK")) parts.push("NOT NULL");
    if (flags.includes("UNIQUE")) parts.push("UNIQUE");
    if (flags.includes("FK")) {
      const target = extractSingleFkTarget(f.no);
      if (target) parts.push(`REFERENCES ${target}(id)`);
    }
    return {
      code: parts.join(" "),
      comment: f.no ? f.no.replace(/\n/g, " ") : "",
    };
  });

  if (isCompositePk) {
    cols.push({ code: `PRIMARY KEY (${pkFields.map((f) => f.n).join(", ")})`, comment: "" });
  }

  const maxLen = Math.max(...cols.map((c) => c.code.length + 1));
  const bodyLines = cols.map((c, i) => {
    const isLast = i === cols.length - 1;
    const codeWithComma = c.code + (isLast ? "" : ",");
    return c.comment
      ? `  ${codeWithComma.padEnd(maxLen + 2)}-- ${c.comment}`
      : `  ${codeWithComma}`;
  });

  const lines = [`CREATE TABLE ${tableName} (`, bodyLines.join("\n"), ");"];

  // idx listesindeki "— PK" ile biten girdiler zaten yukarıda PRIMARY KEY
  // olarak tanımlandı — ikinci kez normal index olarak eklenmesin.
  const idxSql = (tbl.idx || [])
    .filter((i) => !/—\s*PK\s*$/i.test(i))
    .map((i, n) => {
      const isUnique = /UNIQUE/i.test(i);
      const cols2 = i.replace(/—.*$/, "").trim();
      const idxName = `idx_${tableName}_${n + 1}`;
      return `CREATE ${isUnique ? "UNIQUE " : ""}INDEX ${idxName} ON ${tableName} ${cols2};`;
    })
    .join("\n");

  return idxSql ? `${lines.join("\n")}\n\n${idxSql}` : lines.join("\n");
}

// why[] varsa sağ TOC'taki bilgi kartını besleyen frontmatter satırını üretir.
// JSON dizisi geçerli bir YAML flow-scalar'dır — Türkçe/apostrof/backtick içeren
// metinlerde elle YAML kaçışı yapmaktan çok daha güvenli.
function whyFrontmatter(why) {
  if (!why || !why.length) return "";
  return `why: ${JSON.stringify(why)}\n`;
}

function writeDoc(path, content) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content, "utf8");
  console.log("yazıldı:", path.replace(__dirname + "/../", ""));
}

/* ============================================================
   POSTGRESQL VERİ MODELİ
   ============================================================ */

const PG_GROUPS = [
  {
    dir: "core", label: "Core — Multi-tenant Çekirdek", position: 2,
    tables: [
      {
        id: "tenants", position: 1,
        note: "SaaS'ı satın alan gerçek firma. Tüm tenant'a bağlı tablolar buradan türer; multi-tenant izolasyonun kök kaydı.",
        fields: [
          { n: "id", t: "uuid", f: ["PK"], no: "default gen_random_uuid()" },
          { n: "legal_name", t: "varchar(255)", f: ["NN"], no: "resmi unvan" },
          { n: "display_name", t: "varchar(150)" },
          { n: "tax_number", t: "varchar(50)" },
          { n: "tax_office", t: "varchar(150)" },
          { n: "sector", t: "varchar(100)", no: "AI event havuzunda (bkz. Mongo → ui_generation_events) şablon çıkarımı için de kullanılır" },
          { n: "company_size", t: "varchar(20)", no: "1-10 / 11-50 / 51-200 / 200+" },
          { n: "logo_url", t: "text" },
          { n: "billing_email", t: "varchar(255)" },
          { n: "contact_email", t: "varchar(255)" },
          { n: "contact_phone", t: "varchar(50)" },
          { n: "country", t: "varchar(100)" },
          { n: "city", t: "varchar(100)" },
          { n: "subdomain", t: "varchar(100)", f: ["UNIQUE", "NN"] },
          { n: "plan", t: "varchar(50)", no: "default 'trial'; hızlı gösterim için — asıl kaynak plan_id" },
          { n: "plan_id", t: "uuid", f: ["FK", "new"], no: "→ subscription_plans.id, eksikti — eklendi" },
          { n: "modules_enabled", t: "jsonb" },
          { n: "settings", t: "jsonb" },
          { n: "is_active", t: "boolean", no: "default true" },
          { n: "trial_ends_at", t: "timestamptz" },
          { n: "created_at", t: "timestamptz", no: "default now()" },
          { n: "updated_at", t: "timestamptz", no: "default now()" },
        ],
        idx: ["subdomain — UNIQUE"],
        why: [
          "Engellenen edge case — plan yeniden adlandırılınca kotanın sessizce kopması: eğer kota sadece plan varchar'ındaki metne (örn. 'growth') bakarak subscription_plans'ta isimle eşleştirilseydi, pazarlama planı 'Growth' → 'Scale Up' diye yeniden adlandırdığında ya da iki plan birbirine yakın isimli olduğunda eşleştirme hatasız ama YANLIŞ sonuç verirdi — hiçbir hata fırlatmadan yanlış kotayı uygulardı. plan_id somut bir FK olduğu için isim değişse de id sabit kalır, eşleştirme hiç bozulmaz.",
        ],
        example: { id: "8f3c…", legal_name: "Nova Teknoloji A.Ş.", display_name: "Nova", subdomain: "nova", plan: "growth", is_active: true },
      },
      {
        id: "departments", position: 2,
        note: "Tenant içi organizasyon birimleri; parent_department_id ile iç içe dallanabilir (İK → İşe Alım gibi).",
        fields: [
          { n: "id", t: "uuid", f: ["PK"] },
          { n: "tenant_id", t: "uuid", f: ["FK", "NN"], no: "→ tenants.id" },
          { n: "name", t: "varchar(150)", f: ["NN"], no: "İK, Satış, Customer Success, Muhasebe…" },
          { n: "parent_department_id", t: "uuid", f: ["FK"], no: "→ departments.id, iç içe dallanma" },
          { n: "head_user_id", t: "uuid", f: ["FK"], no: "→ users.id" },
          { n: "token_limit_monthly", t: "bigint", f: ["new"], no: "NULL = üst sınır yok (tenant ortak havuzunu kullanır); doluysa bu departmanın aylık üst sınırı" },
          { n: "is_active", t: "boolean", f: ["new"], no: "default true; departman kapatıldığında geçmiş kayıtları bozmadan pasife çekmek için" },
          { n: "created_at", t: "timestamptz", no: "default now()" },
        ],
        idx: ["(tenant_id)", "(tenant_id, parent_department_id)"],
        why: [
          "Engellenen edge case — 'referansı var ama değeri yok' boşluğu: tenant_token_usage.department_id, hangi departmanın ne kadar tükettiğini kaydediyor ama ÜST SINIRIN kendisi hiçbir yerde tanımlı değildi. token_limit_monthly olmadan 'departman kotası' sadece kavramsal kalır, uygulanamaz.",
          "is_active olmadan bir departman kapatıldığında geçmiş tenant_token_usage/tasks kayıtları FK bütünlüğünü korumak için hâlâ o departmana işaret eder ama kullanıcı arayüzünde artık seçilebilir olmamalı — soft-disable bunun için var.",
        ],
      },
      {
        id: "job_levels", position: 3,
        note: "Onay zincirlerinde kullanılan kademe tanımları (rank ne kadar düşükse o kadar üst kademe).",
        fields: [
          { n: "id", t: "uuid", f: ["PK"] },
          { n: "tenant_id", t: "uuid", f: ["FK", "NN"], no: "→ tenants.id" },
          { n: "name", t: "varchar(100)", f: ["NN"], no: "Direktör, Müdür, Takım Lideri, Uzman, Çalışan" },
          { n: "rank", t: "int", f: ["NN"], no: "1 = en üst" },
        ],
        idx: ["(tenant_id, rank) — UNIQUE"],
      },
      {
        id: "roles", position: 4,
        note: "Yetkilendirme rolleri; roles_permissions ile entity bazlı izinlere bağlanır.",
        fields: [
          { n: "id", t: "uuid", f: ["PK"] },
          { n: "tenant_id", t: "uuid", f: ["FK", "NN"], no: "→ tenants.id" },
          { n: "name", t: "varchar(150)", f: ["NN"] },
          { n: "is_system_role", t: "boolean", no: "default false" },
          { n: "created_at", t: "timestamptz", no: "default now()" },
        ],
        idx: ["(tenant_id, name) — UNIQUE"],
      },
      {
        id: "users", position: 5,
        note: "Tenant çalışanı / sistem kullanıcısı. manager_id ile kendine referans veren organizasyon hiyerarşisi kurulur.",
        fields: [
          { n: "id", t: "uuid", f: ["PK"] },
          { n: "tenant_id", t: "uuid", f: ["FK", "NN"], no: "→ tenants.id" },
          { n: "first_name", t: "varchar(150)", f: ["NN"] },
          { n: "last_name", t: "varchar(150)", f: ["NN"] },
          { n: "email", t: "varchar(255)", f: ["NN"] },
          { n: "phone", t: "varchar(50)" },
          { n: "avatar_url", t: "text" },
          { n: "job_title", t: "varchar(150)" },
          { n: "department_id", t: "uuid", f: ["FK"], no: "→ departments.id" },
          { n: "job_level_id", t: "uuid", f: ["FK"], no: "→ job_levels.id" },
          { n: "role_id", t: "uuid", f: ["FK"], no: "→ roles.id" },
          { n: "manager_id", t: "uuid", f: ["FK"], no: "→ users.id (self)" },
          { n: "status", t: "varchar(20)", no: "default 'active'; active/invited/suspended" },
          { n: "timezone", t: "varchar(50)", no: "default 'Europe/Istanbul'" },
          { n: "locale", t: "varchar(10)", no: "default 'tr-TR'" },
          { n: "last_login_at", t: "timestamptz" },
          { n: "display_prefs", t: "jsonb" },
          { n: "created_at", t: "timestamptz", no: "default now()" },
          { n: "updated_at", t: "timestamptz", no: "default now()" },
        ],
        idx: ["(tenant_id, email) — UNIQUE", "(tenant_id, department_id)", "(tenant_id, manager_id)"],
        why: [
          "Engellenen edge case — 'kim davet etti' bilgisinin kaybolması: status alanı zaten 'invited' değerini taşıyor, yani bir kullanıcı başka biri tarafından davet ediliyor — ama created_by olmadan bu davetin kim tarafından yapıldığı hiçbir yerde tutulmuyordu. created_by (kendine referans, manager_id ile aynı desende) bunu kapatıyor.",
          "updated_by, bir kullanıcının rolünü/departmanını kim değiştirdiğini (kendisi mi, bir admin mi) ayırt etmek için gerekli — audit_log'a gitmeden hızlı bir 'son kim dokundu' cevabı verir.",
        ],
      },
      {
        id: "roles_permissions", position: 6,
        note: "Bir rolün, bir entity_type üzerindeki CRUD + onay yetkisi. RBAC matrisinin satırları.",
        fields: [
          { n: "id", t: "uuid", f: ["PK"] },
          { n: "tenant_id", t: "uuid", f: ["FK", "NN"], no: "→ tenants.id" },
          { n: "role_id", t: "uuid", f: ["FK", "NN"], no: "→ roles.id" },
          { n: "entity_type", t: "varchar(50)", f: ["NN"] },
          { n: "can_read", t: "boolean", no: "default true" },
          { n: "can_write", t: "boolean", no: "default false" },
          { n: "can_delete", t: "boolean", no: "default false" },
          { n: "can_approve", t: "boolean", no: "default false" },
        ],
        idx: ["(tenant_id, role_id, entity_type) — UNIQUE"],
      },
      {
        id: "custom_field_definitions", position: 7,
        note: "Tenant'ların kendi entity'lerine (deal, contact vb.) eklediği özel alan tanımları. EAV benzeri esnek şema ihtiyacının Postgres tarafındaki çözümü — MongoDB'deki alternatif modeli için bkz. [MongoDB → custom_field_values](/mongodb/custom-field-values).",
        fields: [
          { n: "id", t: "uuid", f: ["PK"] },
          { n: "tenant_id", t: "uuid", f: ["FK", "NN"], no: "→ tenants.id" },
          { n: "entity_type", t: "varchar(50)", f: ["NN"] },
          { n: "field_key", t: "varchar(100)", f: ["NN"] },
          { n: "field_label", t: "varchar(150)", f: ["NN"] },
          { n: "field_type", t: "varchar(50)", f: ["NN"] },
          { n: "field_options", t: "jsonb" },
          { n: "is_required", t: "boolean", no: "default false" },
          { n: "display_order", t: "int", no: "default 0" },
        ],
        idx: ["(tenant_id, entity_type, field_key) — UNIQUE"],
      },
      {
        id: "activities", position: 8,
        note: "Herhangi bir entity üzerindeki etkileşim geçmişi (arama, e-posta, not). entity_type/entity_id polimorfik ilişki kurar. MongoDB'de tip-özel alanlarla zenginleştirilmiş alternatif modeli için bkz. [MongoDB → activities](/mongodb/activities).",
        fields: [
          { n: "id", t: "uuid", f: ["PK"] },
          { n: "tenant_id", t: "uuid", f: ["FK", "NN"], no: "→ tenants.id" },
          { n: "entity_type", t: "varchar(50)", f: ["NN"], no: "örn. 'deal', 'contact'" },
          { n: "entity_id", t: "uuid", f: ["NN"] },
          { n: "activity_type", t: "varchar(50)", f: ["NN"], no: "call/email/note/meeting" },
          { n: "subject", t: "varchar(255)" },
          { n: "content", t: "text" },
          { n: "duration_minutes", t: "int" },
          { n: "outcome", t: "varchar(100)" },
          { n: "created_by", t: "uuid", f: ["FK"], no: "→ users.id" },
          { n: "created_at", t: "timestamptz", no: "default now()" },
        ],
        idx: ["(tenant_id, entity_type, entity_id)", "(tenant_id, created_by)"],
      },
      {
        id: "attachments", position: 9,
        note: "Herhangi bir entity'e bağlı dosya kaydı (polimorfik).",
        fields: [
          { n: "id", t: "uuid", f: ["PK"] },
          { n: "tenant_id", t: "uuid", f: ["FK", "NN"], no: "→ tenants.id" },
          { n: "entity_type", t: "varchar(50)", f: ["NN"] },
          { n: "entity_id", t: "uuid", f: ["NN"] },
          { n: "file_name", t: "varchar(255)", f: ["NN"] },
          { n: "file_url", t: "text", f: ["NN"] },
          { n: "file_size_bytes", t: "bigint" },
          { n: "uploaded_by", t: "uuid", f: ["FK"], no: "→ users.id" },
          { n: "created_at", t: "timestamptz", no: "default now()" },
        ],
        idx: ["(tenant_id, entity_type, entity_id)", "(tenant_id, uploaded_by)"],
      },
      {
        id: "tasks", position: 10,
        note: "Yapılacak iş kaydı; hem serbest to-do hem de bir board_column üzerinde kanban kartı olarak kullanılabilir.",
        fields: [
          { n: "id", t: "uuid", f: ["PK"] },
          { n: "tenant_id", t: "uuid", f: ["FK", "NN"], no: "→ tenants.id" },
          { n: "entity_type", t: "varchar(50)" },
          { n: "entity_id", t: "uuid" },
          { n: "title", t: "varchar(255)", f: ["NN"] },
          { n: "description", t: "text" },
          { n: "priority", t: "varchar(20)", no: "default 'medium'" },
          { n: "due_date", t: "timestamptz" },
          { n: "assigned_to", t: "uuid", f: ["FK"], no: "→ users.id" },
          { n: "status", t: "varchar(20)", no: "default 'open'" },
          { n: "board_column_id", t: "uuid", f: ["FK"], no: "→ board_columns.id" },
          { n: "card_order", t: "int", no: "default 0" },
          { n: "story_points", t: "int" },
          { n: "completed_at", t: "timestamptz", f: ["new"], no: "eksikti — status='done' olduğunda set edilir" },
          { n: "created_at", t: "timestamptz", no: "default now()" },
          { n: "updated_at", t: "timestamptz", f: ["new"], no: "eksikti — eklendi" },
        ],
        idx: ["(tenant_id, entity_type, entity_id)", "(tenant_id, assigned_to, status)", "(board_column_id, card_order)"],
      },
      {
        id: "tags", position: 11,
        note: "Tenant'a özel serbest etiket tanımları.",
        fields: [
          { n: "id", t: "uuid", f: ["PK"] },
          { n: "tenant_id", t: "uuid", f: ["FK", "NN"], no: "→ tenants.id" },
          { n: "name", t: "varchar(100)", f: ["NN"] },
          { n: "color", t: "varchar(20)" },
          { n: "created_at", t: "timestamptz", f: ["new"], no: "eksikti — eklendi" },
        ],
        idx: ["(tenant_id, name) — UNIQUE"],
      },
      {
        id: "taggables", position: 12,
        note: "tags ile herhangi bir entity arasındaki çoktan-çoğa polimorfik bağlantı tablosu.",
        fields: [
          { n: "tenant_id", t: "uuid", f: ["FK", "NN", "new"], no: "→ tenants.id — RLS (Row-Level Security) için denormalize edildi, eksikti" },
          { n: "tag_id", t: "uuid", f: ["PK", "FK", "NN"], no: "→ tags.id" },
          { n: "entity_type", t: "varchar(50)", f: ["PK", "NN"] },
          { n: "entity_id", t: "uuid", f: ["PK", "NN"] },
        ],
        idx: ["(tag_id, entity_type, entity_id) — PK", "(tenant_id, entity_type, entity_id)"],
      },
      {
        id: "notifications", position: 13,
        note: "Kullanıcıya gösterilen bildirimler; is_read ile okunma durumu takip edilir.",
        fields: [
          { n: "id", t: "uuid", f: ["PK"] },
          { n: "tenant_id", t: "uuid", f: ["FK", "NN"], no: "→ tenants.id" },
          { n: "user_id", t: "uuid", f: ["FK", "NN"], no: "→ users.id" },
          { n: "entity_type", t: "varchar(50)" },
          { n: "entity_id", t: "uuid" },
          { n: "title", t: "varchar(255)", f: ["NN"] },
          { n: "body", t: "text" },
          { n: "is_read", t: "boolean", no: "default false" },
          { n: "created_at", t: "timestamptz", no: "default now()" },
        ],
        idx: ["(tenant_id, user_id, is_read)"],
      },
      {
        id: "audit-log", position: 14, migrated: true, displayName: "audit_log",
        note: "Bu tablo tamamen MongoDB'ye taşındı. Gerekçe: append-only, çok yüksek yazma hacmi, `changes` alanı zaten serbest yapı (jsonb) — büyüdükçe Postgres'te index bakımı/vacuum maliyeti artıyor, Mongo'da TTL index ile otomatik temizlenebiliyor.",
        mongoRef: "/mongodb/audit-log", mongoLabel: "audit_log koleksiyonuna git",
        why: [
          "changes alanı entity_type'a göre tamamen farklı şekiller alır — Postgres'te bunu jsonb ile idare etmek yerine Mongo'nun doğal esnekliğine bırakıyoruz.",
          "TTL index ile eski kayıtları otomatik silmek Mongo'da tek satır, Postgres'te ayrı bir cron/partition stratejisi gerektirirdi.",
        ],
      },
    ],
  },
  {
    dir: "crm", label: "CRM", position: 3,
    tables: [
      {
        id: "companies", position: 1,
        note: "Tenant'ın kendi müşteri/tedarikçi defteri. `tenants` tablosuyla karıştırılmamalı — companies, tenant'ın DIŞ dünyada takip ettiği firmalardır.",
        fields: [
          { n: "id", t: "uuid", f: ["PK"] },
          { n: "tenant_id", t: "uuid", f: ["FK", "NN"], no: "→ tenants.id" },
          { n: "name", t: "varchar(255)", f: ["NN"] },
          { n: "company_type", t: "varchar(20)", no: "default 'prospect'; prospect/customer/supplier/partner" },
          { n: "industry", t: "varchar(100)" },
          { n: "tax_number", t: "varchar(50)" },
          { n: "website", t: "varchar(255)" },
          { n: "phone", t: "varchar(50)" },
          { n: "email", t: "varchar(255)" },
          { n: "employee_count", t: "int" },
          { n: "annual_revenue", t: "numeric(16,2)" },
          { n: "source", t: "varchar(100)" },
          { n: "owner_id", t: "uuid", f: ["FK"], no: "→ users.id" },
          { n: "status", t: "varchar(20)", no: "default 'active'" },
          { n: "custom_fields", t: "jsonb" },
          { n: "created_at", t: "timestamptz", no: "default now()" },
          { n: "updated_at", t: "timestamptz", no: "default now()" },
        ],
        idx: ["(tenant_id, status)", "(tenant_id, owner_id)", "(tenant_id, company_type)"],
      },
      {
        id: "contacts", position: 2,
        note: "Bir company'ye bağlı kişi kaydı. `do_not_contact` alanı KVKK uyumluluğu için tutulur.",
        fields: [
          { n: "id", t: "uuid", f: ["PK"] },
          { n: "tenant_id", t: "uuid", f: ["FK", "NN"], no: "→ tenants.id" },
          { n: "company_id", t: "uuid", f: ["FK"], no: "→ companies.id" },
          { n: "first_name", t: "varchar(150)", f: ["NN"] },
          { n: "last_name", t: "varchar(150)", f: ["NN"] },
          { n: "job_title", t: "varchar(150)" },
          { n: "department", t: "varchar(150)" },
          { n: "email", t: "varchar(255)" },
          { n: "phone", t: "varchar(50)" },
          { n: "mobile_phone", t: "varchar(50)" },
          { n: "linkedin_url", t: "varchar(255)" },
          { n: "is_primary", t: "boolean", no: "default false" },
          { n: "do_not_contact", t: "boolean", no: "default false; KVKK" },
          { n: "custom_fields", t: "jsonb" },
          { n: "created_at", t: "timestamptz", no: "default now()" },
          { n: "updated_at", t: "timestamptz", f: ["new"], no: "eksikti — eklendi" },
        ],
        idx: ["(tenant_id, company_id)", "(tenant_id, email)"],
      },
      {
        id: "addresses", position: 3,
        note: "Bir company'ye bağlı adres kaydı; bir firmanın birden çok adresi olabilir.",
        fields: [
          { n: "id", t: "uuid", f: ["PK"] },
          { n: "tenant_id", t: "uuid", f: ["FK", "NN"], no: "→ tenants.id" },
          { n: "company_id", t: "uuid", f: ["FK"], no: "→ companies.id" },
          { n: "address_type", t: "varchar(20)", no: "default 'office'" },
          { n: "country", t: "varchar(100)" },
          { n: "city", t: "varchar(100)" },
          { n: "district", t: "varchar(100)" },
          { n: "full_address", t: "text" },
          { n: "postal_code", t: "varchar(20)" },
          { n: "created_at", t: "timestamptz", f: ["new"], no: "eksikti — hiç timestamp yoktu, eklendi" },
        ],
        idx: ["(tenant_id, company_id)"],
      },
      {
        id: "pipeline-stages", position: 4, displayName: "pipeline_stages",
        note: "Satış hunisinin (pipeline) aşamaları; order_index sıralamayı belirler.",
        fields: [
          { n: "id", t: "uuid", f: ["PK"] },
          { n: "tenant_id", t: "uuid", f: ["FK", "NN"], no: "→ tenants.id" },
          { n: "name", t: "varchar(100)", f: ["NN"] },
          { n: "order_index", t: "int", f: ["NN"] },
          { n: "is_won", t: "boolean", no: "default false" },
          { n: "is_lost", t: "boolean", no: "default false" },
          { n: "color", t: "varchar(20)" },
          { n: "created_at", t: "timestamptz", f: ["new"], no: "eksikti — eklendi" },
        ],
        idx: ["(tenant_id, order_index)", "(tenant_id, name) — UNIQUE"],
      },
      {
        id: "deals", position: 5,
        note: "Satış fırsatı. Bir company/contact'a, bir pipeline_stage'e bağlanır; amount/probability üzerinden pipeline değeri hesaplanır.",
        fields: [
          { n: "id", t: "uuid", f: ["PK"] },
          { n: "tenant_id", t: "uuid", f: ["FK", "NN"], no: "→ tenants.id" },
          { n: "company_id", t: "uuid", f: ["FK"], no: "→ companies.id" },
          { n: "contact_id", t: "uuid", f: ["FK"], no: "→ contacts.id" },
          { n: "stage_id", t: "uuid", f: ["FK"], no: "→ pipeline_stages.id" },
          { n: "title", t: "varchar(255)", f: ["NN"] },
          { n: "amount", t: "numeric(14,2)" },
          { n: "currency", t: "varchar(10)", no: "default 'TRY'" },
          { n: "probability", t: "smallint", f: ["new"], no: "0-100 arası, CHECK constraint — önceki revizyonda int'ti, daraltıldı" },
          { n: "expected_close_date", t: "date" },
          { n: "source", t: "varchar(100)" },
          { n: "owner_id", t: "uuid", f: ["FK"], no: "→ users.id" },
          { n: "status", t: "varchar(20)", no: "default 'open'" },
          { n: "lost_reason", t: "varchar(255)" },
          { n: "custom_fields", t: "jsonb" },
          { n: "created_at", t: "timestamptz", no: "default now()" },
          { n: "updated_at", t: "timestamptz", no: "default now()" },
        ],
        idx: ["(tenant_id, stage_id)", "(tenant_id, owner_id, status)", "(tenant_id, company_id)"],
      },
    ],
  },
  {
    dir: "erp", label: "ERP / İç Operasyon", position: 4,
    tables: [
      {
        id: "projects", position: 1,
        note: "İç operasyon projesi; code alanı kısa referans (örn. PRJ-001) taşır.",
        fields: [
          { n: "id", t: "uuid", f: ["PK"] },
          { n: "tenant_id", t: "uuid", f: ["FK", "NN"], no: "→ tenants.id" },
          { n: "code", t: "varchar(50)", no: "PRJ-001 gibi kısa referans" },
          { n: "name", t: "varchar(255)", f: ["NN"] },
          { n: "description", t: "text" },
          { n: "status", t: "varchar(20)", no: "default 'active'" },
          { n: "priority", t: "varchar(20)", no: "default 'medium'" },
          { n: "owner_id", t: "uuid", f: ["FK"], no: "→ users.id" },
          { n: "start_date", t: "date" },
          { n: "end_date", t: "date" },
          { n: "budget", t: "numeric(14,2)" },
          { n: "custom_fields", t: "jsonb" },
          { n: "created_at", t: "timestamptz", no: "default now()" },
          { n: "updated_at", t: "timestamptz", f: ["new"], no: "eksikti — eklendi" },
        ],
        idx: ["(tenant_id, status)", "(tenant_id, owner_id)"],
      },
      {
        id: "project-members", position: 2, displayName: "project_members",
        note: "Bir projenin üyeleri; user başına rol taşıyan çoktan-çoğa bağlantı tablosu.",
        fields: [
          { n: "tenant_id", t: "uuid", f: ["FK", "NN", "new"], no: "→ tenants.id — RLS için denormalize edildi, eksikti" },
          { n: "project_id", t: "uuid", f: ["PK", "FK", "NN"], no: "→ projects.id" },
          { n: "user_id", t: "uuid", f: ["PK", "FK", "NN"], no: "→ users.id" },
          { n: "project_role", t: "varchar(20)", no: "default 'member'" },
          { n: "joined_at", t: "timestamptz", no: "default now()" },
        ],
        idx: ["(project_id, user_id) — PK", "(tenant_id, user_id)"],
      },
      {
        id: "boards", position: 3,
        note: "Bir projeye bağlı kanban/görev panosu.",
        fields: [
          { n: "id", t: "uuid", f: ["PK"] },
          { n: "tenant_id", t: "uuid", f: ["FK", "NN"], no: "→ tenants.id" },
          { n: "project_id", t: "uuid", f: ["FK", "NN"], no: "→ projects.id" },
          { n: "name", t: "varchar(255)", f: ["NN"] },
          { n: "board_type", t: "varchar(20)", no: "default 'kanban'" },
          { n: "created_at", t: "timestamptz", no: "default now()" },
          { n: "updated_at", t: "timestamptz", f: ["new"], no: "eksikti — eklendi" },
        ],
        idx: ["(tenant_id, project_id)"],
      },
      {
        id: "board-columns", position: 4, displayName: "board_columns",
        note: "Bir board'un sütunları (örn. Yapılacak / Devam Ediyor / Bitti). wip_limit ile sütun kapasitesi sınırlanabilir.",
        fields: [
          { n: "tenant_id", t: "uuid", f: ["FK", "NN", "new"], no: "→ tenants.id — RLS için denormalize edildi, eksikti" },
          { n: "id", t: "uuid", f: ["PK"] },
          { n: "board_id", t: "uuid", f: ["FK", "NN"], no: "→ boards.id" },
          { n: "name", t: "varchar(100)", f: ["NN"] },
          { n: "order_index", t: "int", f: ["NN"], no: "default 0" },
          { n: "wip_limit", t: "int" },
          { n: "created_at", t: "timestamptz", f: ["new"], no: "eksikti — eklendi" },
        ],
        idx: ["(tenant_id, board_id, order_index)"],
      },
      {
        id: "calendar-events", position: 5, displayName: "calendar_events",
        note: "Takvim etkinliği; entity_type/entity_id ile başka bir kayda (örn. bir deal görüşmesi) bağlanabilir, dış takvim senkronizasyonu için provider/id alanları taşır.",
        fields: [
          { n: "id", t: "uuid", f: ["PK"] },
          { n: "tenant_id", t: "uuid", f: ["FK", "NN"], no: "→ tenants.id" },
          { n: "title", t: "varchar(255)", f: ["NN"] },
          { n: "description", t: "text" },
          { n: "start_time", t: "timestamptz", f: ["NN"] },
          { n: "end_time", t: "timestamptz", f: ["NN"] },
          { n: "is_all_day", t: "boolean", no: "default false" },
          { n: "location", t: "varchar(255)" },
          { n: "entity_type", t: "varchar(50)" },
          { n: "entity_id", t: "uuid" },
          { n: "external_calendar_provider", t: "varchar(50)" },
          { n: "external_event_id", t: "varchar(255)" },
          { n: "created_by", t: "uuid", f: ["FK"], no: "→ users.id" },
          { n: "created_at", t: "timestamptz", no: "default now()" },
          { n: "updated_at", t: "timestamptz", f: ["new"], no: "eksikti — eklendi" },
        ],
        idx: ["(tenant_id, start_time)", "(tenant_id, entity_type, entity_id)"],
      },
      {
        id: "calendar-event-attendees", position: 6, displayName: "calendar_event_attendees",
        note: "Bir etkinliğe davetli kullanıcılar ve RSVP durumu.",
        fields: [
          { n: "tenant_id", t: "uuid", f: ["FK", "NN", "new"], no: "→ tenants.id — RLS için denormalize edildi, eksikti" },
          { n: "event_id", t: "uuid", f: ["PK", "FK", "NN"], no: "→ calendar_events.id" },
          { n: "user_id", t: "uuid", f: ["PK", "FK", "NN"], no: "→ users.id" },
          { n: "rsvp_status", t: "varchar(20)", no: "default 'pending'" },
        ],
        idx: ["(event_id, user_id) — PK", "(tenant_id, user_id)"],
      },
    ],
  },
  {
    dir: "ai", label: "AI Katalog", position: 5,
    tables: [
      {
        id: "ai-conversations", position: 1, displayName: "ai_conversations",
        note: "AI konuşmasının Postgres tarafındaki ince (thin) kaydı. Mesaj gövdesi burada YOK — tamamen MongoDB'de tutulur (bkz. [MongoDB → ai_message_buckets](/mongodb/ai-message-buckets)). Bu tablo yalnızca tenant/user FK bütünlüğünü ve 'kullanıcının konuşma listesi' gibi hızlı JOIN'li ekranları besler.",
        fields: [
          { n: "id", t: "uuid", f: ["PK"], no: "Mongo tarafında conversation_id olarak referans alınır (app-level, DB FK değil)" },
          { n: "tenant_id", t: "uuid", f: ["FK", "NN"], no: "→ tenants.id" },
          { n: "user_id", t: "uuid", f: ["FK", "NN"], no: "→ users.id" },
          { n: "title", t: "varchar(255)" },
          { n: "started_at", t: "timestamptz", no: "default now()" },
          { n: "last_message_at", t: "timestamptz" },
          { n: "is_archived", t: "boolean", no: "default false" },
          { n: "message_count", t: "int", f: ["new"], no: "Mongo'daki mesaj sayısının senkron kopyası — liste ekranı Mongo'ya gitmeden çalışsın diye" },
        ],
        idx: ["(tenant_id, user_id, last_message_at)"],
      },
      {
        id: "ai-messages-family", position: 2, migrated: true,
        displayName: "ai_messages, ai_message_tool_calls, ai_message_ui_widgets",
        note: "Bu üç tablo tamamen MongoDB'ye taşındı ve tek bir koleksiyona (`ai_message_buckets`) konsolide edildi. Gerekçe: mesajlar her zaman sırayla ve birlikte okunuyor, nadiren tek başına JOIN ile sorgulanıyor — klasik 'gömme' (embedding) senaryosu. Sınırsız büyüyebilecekleri için düz embed yerine Bucket Pattern kullanıldı (bkz. [MongoDB → Modelleme İlkeleri](/mongodb/principles)).",
        mongoRef: "/mongodb/ai-message-buckets", mongoLabel: "ai_message_buckets koleksiyonuna git",
        why: [
          "3 ayrı tabloyu JOIN ile birleştirmek yerine, zaten hep birlikte okunan veriyi tek belgede toplamak sorguyu basitleştiriyor.",
          "Bir konuşma sınırsız büyüyebileceği için düz embed yerine Bucket Pattern (≤50 mesaj/belge) kullanıldı — 16MB BSON limitine karşı önlem.",
        ],
      },
    ],
  },
  {
    dir: "platform", label: "Platform & Yetkilendirme", position: 6,
    tables: [
      {
        id: "permissions", position: 1,
        note: "'Ne verilebilir' kataloğu — role bağlı değil, tek başına bir izin tanımı. `catalog_type` + `catalog_item_id`, `ui_components`/`action_registry`/`tool_registry` tablolarındaki gerçek `id`'yle eşleşir (hangi tabloya bakılacağını catalog_type söyler — DB bunu tek bir FK constraint'iyle zorlayamaz ama en azından eşleşme isim değil id üzerinden, mevcut entity_type/entity_id polimorfik desenimizle tutarlı). Mevcut `roles_permissions` tablosunun YERİNE geçmiyor: roles_permissions veri (deal/contact CRUD) erişimini, bu tablo ise katalog öğesi (UI component/action/tool) erişimini kontrol ediyor — iki farklı katman.",
        fields: [
          { n: "id", t: "uuid", f: ["PK"] },
          { n: "catalog_type", t: "varchar(20)", f: ["NN"], no: "'ui' | 'function' | 'tool' — catalog_item_id hangi tabloda aranacak, bunu belirler" },
          { n: "catalog_item_id", t: "uuid", f: ["NN", "new"], no: "→ ui_components.id / action_registry.id / tool_registry.id (catalog_type'a göre) — önceden catalog_item_name (isim) idi, düzeltildi" },
          { n: "action", t: "varchar(20)", no: "default 'execute'; view/execute/write" },
          { n: "requires_confirm", t: "boolean", no: "default false" },
          { n: "is_active", t: "boolean", no: "default true" },
          { n: "created_at", t: "timestamptz", no: "default now()" },
        ],
        idx: ["(catalog_type, catalog_item_id, action) — UNIQUE"],
        why: [
          "İzin tanımını (permissions) ve kime verildiğini (role_permissions) ayırmak, aynı izni birden fazla role bağlarken satır çoğaltmadan yönetmemizi sağlıyor.",
          "Engellenen edge case — isim değişince iznin sessizce kopması: ilk revizyonda catalog_item_name (örn. 'BarChart' string'i) kullanılmıştı. Bir component/action/tool yeniden adlandırılırsa (ör. 'BarChart' → 'BarChartV2') isimle eşleşen izin sessizce hiçbir şeye bağlanmaz kalırdı — hata vermeden. catalog_item_id kullanmak, mevcut entity_type/entity_id polimorfik desenimizle de (activities, attachments, tasks) tutarlı hale getirdi: isim değil id üzerinden eşleştiriyoruz.",
        ],
      },
      {
        id: "role-permissions", position: 2, displayName: "role_permissions",
        note: "Köprü tablo — 'kime ne verildi'. `tenant_id` NULL ise global atama (örn. admin rolü her yerde bu izne sahip), doluysa sadece o tenant için tanımlanmış istisna.",
        fields: [
          { n: "id", t: "uuid", f: ["PK"] },
          { n: "tenant_id", t: "uuid", f: ["FK"], no: "→ tenants.id, NULL = global atama" },
          { n: "role_id", t: "uuid", f: ["FK", "NN"], no: "→ roles.id" },
          { n: "permission_id", t: "uuid", f: ["FK", "NN"], no: "→ permissions.id" },
          { n: "granted_by", t: "uuid", f: ["FK"], no: "→ users.id, audit için" },
          { n: "granted_at", t: "timestamptz", no: "default now()" },
        ],
        idx: ["(role_id, permission_id, tenant_id) — UNIQUE"],
        why: [
          "tenant_id NULL/dolu ayrımı, global bir kuralı bozmadan tek bir tenant için istisna tanımlamamıza izin veriyor.",
          "granted_by + granted_at ile 'bu izni kim, ne zaman verdi' sorusu ayrı bir audit sorgusuna gitmeden bu tablodan cevaplanabiliyor.",
        ],
      },
      {
        id: "ui-components", position: 3, displayName: "ui_components",
        note: "Dinamik UI'ın seçebileceği görsel component kataloğu (Table, BarChart, KPICard, ComparisonView…). LLM'e asla kod/HTML ürettirmiyoruz — sadece bu kataloğun içinden isimle seçim yaptırıyoruz.",
        fields: [
          { n: "id", t: "uuid", f: ["PK"] },
          { n: "name", t: "varchar(100)", f: ["UNIQUE", "NN"], no: "'Table', 'BarChart', 'KPICard'…" },
          { n: "category", t: "varchar(50)", no: "data-display / chart / comparison / action" },
          { n: "prop_schema", t: "jsonb", f: ["NN"], no: "LLM çıktısının prop'larını doğrulayan JSON Schema" },
          { n: "description", t: "text", no: "LLM sistem promptunda 'ne zaman kullanılır' açıklaması" },
          { n: "is_active", t: "boolean", no: "default true" },
          { n: "created_at", t: "timestamptz", no: "default now()" },
        ],
        idx: ["name — UNIQUE"],
        why: [
          "prop_schema, LLM'in ürettiği JSON'u backend'e ulaşmadan önce doğrulamak için var — component ismi doğru ama prop'lar şemaya uymuyorsa istek reddedilir.",
          "LLM'e kod değil sadece katalogdaki bir isim seçtirmek, güvenlik sınırını burada çiziyor (önceki oturumdaki 'gölgeleme' prensibi).",
        ],
      },
      {
        id: "action-registry", position: 4, displayName: "action_registry",
        note: "Kullanıcıya önerilebilecek buton/aksiyon kataloğu (create_task, export_pdf, send_reminder…). LLM aksiyonu 'önerir', gerçek çalıştırma tıklandığında backend dispatcher'da izin kontrolünden sonra olur.",
        fields: [
          { n: "id", t: "uuid", f: ["PK"] },
          { n: "name", t: "varchar(100)", f: ["UNIQUE", "NN"], no: "'create_task', 'export_pdf', 'send_reminder'" },
          { n: "label_template", t: "varchar(150)", no: "Butonda gösterilecek metin şablonu" },
          { n: "handler_ref", t: "varchar(150)", f: ["NN"], no: "backend fonksiyon ismi — URL DEĞİL, sadece isim" },
          { n: "required_params", t: "jsonb" },
          { n: "risk_level", t: "varchar(20)", no: "default 'low'; low/medium/high" },
          { n: "requires_confirm", t: "boolean", no: "default false" },
          { n: "is_active", t: "boolean", no: "default true" },
        ],
        idx: ["name — UNIQUE"],
        why: [
          "handler_ref bir URL/endpoint değil sadece bir isim — gerçek execution backend dispatcher'da, permission kontrolünden SONRA gerçekleşiyor. LLM'in eline hiçbir zaman çalıştırılabilir bir adres geçmiyor.",
          "risk_level=high olan aksiyonlar dispatch anında ekstra onay ister — LLM'in 'öneri' yetkisi execution yetkisiyle karışmıyor.",
        ],
      },
      {
        id: "tool-registry", position: 5, displayName: "tool_registry",
        note: "Mini/Ana LLM'in veri çekmek için çağırabileceği tool kataloğu (get_deals, get_department_costs…).",
        fields: [
          { n: "id", t: "uuid", f: ["PK"] },
          { n: "name", t: "varchar(100)", f: ["UNIQUE", "NN"], no: "'get_deals', 'get_department_costs'" },
          { n: "description", t: "text", no: "LLM'e: bu tool ne döner, ne zaman çağrılır" },
          { n: "input_schema", t: "jsonb" },
          { n: "output_shape_hint", t: "jsonb", no: "'kaç tablo/satır dönebilir' ipucu" },
          { n: "underlying_query_ref", t: "varchar(150)", f: ["NN"], no: "SQL/prosedür ismi — SQL'in kendisi değil" },
          { n: "is_active", t: "boolean", no: "default true" },
        ],
        idx: ["name — UNIQUE"],
        why: [
          "output_shape_hint, UI üretici LLM'e veri gelmeden önce kabaca ne bekleyeceğini söyler — ama nihai UI kararı gerçek veri döndükten SONRA verilir (önce sorgu, sonra UI akışı).",
          "underlying_query_ref de handler_ref ile aynı mantık: isim, SQL'in kendisi değil — SQL'i LLM değil backend çalıştırıyor.",
        ],
      },
      {
        id: "tenant-ui-overrides", position: 6, displayName: "tenant_ui_overrides",
        note: "Firma-özel UI Kataloğu — bir tenant'ın standart bir component'i nasıl özelleştirdiği (renk, varsayılan görünüm).",
        fields: [
          { n: "id", t: "uuid", f: ["PK"] },
          { n: "tenant_id", t: "uuid", f: ["FK", "NN"], no: "→ tenants.id" },
          { n: "base_component_id", t: "uuid", f: ["FK", "NN"], no: "→ ui_components.id" },
          { n: "override_config", t: "jsonb", no: "renk, logo, varsayılan görünüm tercihi" },
          { n: "created_at", t: "timestamptz", no: "default now()" },
        ],
        idx: ["(tenant_id, base_component_id)"],
        why: [
          "ui_components'in kendisini tenant başına çoğaltmak yerine sadece farkı (override) saklıyoruz — component kataloğu tek, tutarlı kalıyor.",
        ],
      },
      {
        id: "subscription-plans", position: 7, displayName: "subscription_plans",
        note: "Paket/plan tanımı — Starter/Growth/Scale gibi. `tenants.plan_id` buraya işaret eder.",
        fields: [
          { n: "id", t: "uuid", f: ["PK"] },
          { n: "name", t: "varchar(100)", f: ["NN"], no: "Starter / Growth / Scale" },
          { n: "monthly_token_quota", t: "bigint", f: ["NN"] },
          { n: "price_amount", t: "numeric(10,2)" },
          { n: "price_currency", t: "varchar(10)", no: "default 'USD'" },
          { n: "is_active", t: "boolean", no: "default true" },
        ],
        why: [
          "Paket tanımı tek yerde — kota/fiyat değişikliğinde tüm tenant satırlarını değil sadece bu tabloyu güncelleriz.",
        ],
      },
      {
        id: "tenant-token-usage", position: 8, displayName: "tenant_token_usage",
        note: "Tenant başına dönemsel token sayacı — mini/ana LLM'e gitmeden ÖNCE kontrol edilen, hot-path'teki tek tablo.",
        fields: [
          { n: "id", t: "uuid", f: ["PK"] },
          { n: "tenant_id", t: "uuid", f: ["FK", "NN"], no: "→ tenants.id" },
          { n: "department_id", t: "uuid", f: ["FK"], no: "→ departments.id, NULL = tenant geneli ortak havuz" },
          { n: "period", t: "varchar(7)", f: ["NN"], no: "'YYYY-MM'" },
          { n: "reserved_tokens", t: "bigint", no: "default 0; LLM çağrısı başlamadan önce tahmini rezervasyon" },
          { n: "actual_tokens", t: "bigint", no: "default 0; LLM cevabı gelince kesinleşen gerçek miktar" },
          { n: "quota_limit", t: "bigint", f: ["NN"], no: "o dönem için geçerli kota — plan sonradan değişse bile sabit kalır" },
          { n: "updated_at", t: "timestamptz", no: "default now()" },
        ],
        idx: ["(tenant_id, period) — UNIQUE", "(tenant_id, department_id, period)"],
        why: [
          "Engellenen edge case — çifte harcama/race condition: LLM cevabı gelmeden gerçek token sayısı bilinmiyor. reserved_tokens olmasaydı, kotasının sınırında olan bir tenant'ın aynı anda attığı 5 istek hepsi 'kabaca yeterli' görüp geçerdi ve toplamda kotayı fena aşardı. Çözüm: önce tahminle rezerve et (reserved_tokens), cevap gelince gerçek sayıyla düzelt (actual_tokens).",
          "Engellenen edge case — bir kullanıcının tüm firma kotasını tek başına tüketmesi: department_id nullable bırakıldı, MVP'de tenant geneli tek ortak havuz ama departments.token_limit_monthly doldurulunca departman bazlı üst sınır şema değişikliği gerekmeden açılabilir.",
          "Engellenen edge case — ay ortası plan yükseltmesinde geçmişin bozulması: quota_limit dönem bazlı satırda tutuluyor, bu sayede bir tenant ayın 15'inde paket yükseltirse geçmiş dönemlerin kotası geriye dönük değişmiyor.",
        ],
      },
      {
        id: "models", position: 9, displayName: "models",
        note: "Bedrock (ve ileride başka sağlayıcıların) modellerinin kendi kataloğumuz — llm_model_routing, model_pricing ve Mongo'daki llm_call_log hep bu tablonun `id`'sine referans verir, ham sağlayıcı string'ine değil.",
        fields: [
          { n: "id", t: "uuid", f: ["PK"] },
          { n: "provider", t: "varchar(50)", f: ["NN"], no: "default 'bedrock'" },
          { n: "provider_model_id", t: "varchar(150)", f: ["NN", "UNIQUE"], no: "sağlayıcının ham string ID'si, örn. 'anthropic.claude-sonnet-5'" },
          { n: "display_name", t: "varchar(150)", no: "'Claude Sonnet 5' gibi okunaklı isim" },
          { n: "is_active", t: "boolean", no: "default true" },
          { n: "created_at", t: "timestamptz", no: "default now()" },
        ],
        idx: ["provider_model_id — UNIQUE"],
        why: [
          "Engellenen edge case — sağlayıcı isim değiştirince tüm zincirin kopması: llm_model_routing, model_pricing ve llm_call_log hepsi doğrudan Bedrock'un ham string ID'sine ('anthropic.claude-sonnet-5') referans verseydi, AWS bu string'i değiştirdiğinde (versiyon güncellemesi, yeniden adlandırma) üç yerin de senkron güncellenmesi gerekirdi — biri unutulursa sessizce kopardı. Şimdi tek nokta (models.provider_model_id) güncellenir, geri kalanı kendi sabit id'mize bağlı kalır.",
        ],
      },
      {
        id: "llm-model-routing", position: 10, displayName: "llm_model_routing",
        note: "Hangi adımda (niyet tespiti / UI üretimi / tool call) hangi modelin kullanılacağını belirleyen yönlendirme tablosu.",
        fields: [
          { n: "id", t: "uuid", f: ["PK"] },
          { n: "purpose", t: "varchar(50)", f: ["UNIQUE", "NN"], no: "intent_detection / ui_generation / tool_call" },
          { n: "model_id", t: "uuid", f: ["FK", "NN"], no: "→ models.id — önceden ham Bedrock string'iydi, düzeltildi" },
          { n: "fallback_model_id", t: "uuid", f: ["FK"], no: "→ models.id, birincil model hata verirse kullanılacak model" },
          { n: "is_active", t: "boolean", no: "default true" },
          { n: "updated_at", t: "timestamptz", no: "default now()" },
        ],
        idx: ["purpose — UNIQUE"],
        why: [
          "Engellenen edge case — model değişikliğinin deploy gerektirmesi: model seçimi koda gömülü olsaydı, daha ucuz/hızlı bir modele geçiş için kod değişikliği + deploy gerekirdi. Burada tek satır UPDATE yeterli.",
          "fallback_model_id olmadan birincil model hata verdiğinde (timeout, rate limit) istek tamamen başarısız olurdu — otomatik ikinci bir modele düşme imkânı burada tanımlı.",
          "model_id artık models.id'ye FK — ham Bedrock string'ine değil (bkz. models tablosu gerekçesi).",
        ],
      },
      {
        id: "model-pricing", position: 11, displayName: "model_pricing",
        note: "Model fiyatlandırması, tarihe bağlı (effective-dated).",
        fields: [
          { n: "id", t: "uuid", f: ["PK"] },
          { n: "model_id", t: "uuid", f: ["FK", "NN"], no: "→ models.id — önceden ham Bedrock string'iydi, düzeltildi" },
          { n: "input_price_per_1k", t: "numeric(10,6)", f: ["NN"] },
          { n: "output_price_per_1k", t: "numeric(10,6)", f: ["NN"] },
          { n: "effective_date", t: "date", f: ["NN"] },
          { n: "created_at", t: "timestamptz", no: "default now()" },
        ],
        idx: ["(model_id, effective_date)"],
        why: [
          "Engellenen edge case — geçmiş raporların yanlış yeniden hesaplanması: fiyat tek bir alanda (örn. llm_model_routing.price) tutulsaydı, Bedrock fiyat değiştirdiğinde geçmiş ayların maliyet raporu da YENİ fiyatla yeniden hesaplanmış gibi görünürdü. effective_date'li ayrı tablo, o tarihte geçerli fiyatı sabitliyor.",
          "llm_call_log (Mongo) her çağrıda gerçek maliyeti bu tablodan o anki fiyatla hesaplayıp kendi içine donmuş (frozen) olarak yazar — fiyat sonradan değişse bile geçmiş kayıt bozulmaz.",
        ],
      },
    ],
  },
];

/* ============================================================
   OTOMATİK ALAN ENJEKSİYONU — created_by / updated_by / deleted_at
   ============================================================
   35 tabloyu elle tek tek düzenlemek yerine, hangi tabloların
   "kim oluşturdu / kim güncelledi / soft-delete" alanlarına ihtiyacı
   olduğunu burada tek yerden yönetiyoruz. Dışarıda bırakılanlar:
   - Bridge/köprü tablolar (taggables, project_members,
     calendar_event_attendees, role_permissions) — bağımsız bir
     yaşam döngüleri yok, sadece üyelik kaydı.
   - Zaten eşdeğer bir alanı olanlar (activities.created_by,
     attachments.uploaded_by, calendar_events.created_by,
     role_permissions.granted_by) — tekrar eklenmiyor.
   - tenants (kendi kendine kayıt olur, "oluşturan" kavramı yok) ve
     tenant_token_usage (sistem tarafından hesaplanır, kullanıcı
     oluşturmaz).
   - Zaten is_active taşıyan config/katalog tabloları (roles hariç —
     roles'e created_by/updated_by ekliyoruz ama soft-delete için
     is_active zaten yeterli, ayrıca deleted_at eklemiyoruz).
*/
const AUDIT_FIELD_TABLES = new Set([
  "users",
  "departments", "job_levels", "roles", "custom_field_definitions", "tasks", "tags",
  "companies", "contacts", "addresses", "pipeline-stages", "deals",
  "projects", "boards", "board-columns",
  "permissions", "ui-components", "action-registry", "tool-registry",
  "tenant-ui-overrides", "subscription-plans", "models", "llm-model-routing", "model-pricing",
]);

const SOFT_DELETE_TABLES = new Set([
  "companies", "contacts", "addresses", "deals",
  "projects", "boards", "board-columns", "tasks",
  "custom_field_definitions", "tags",
]);

function injectSystemFields(tbl) {
  if (tbl.migrated) return;
  const fields = tbl.fields;
  const createdAtIdx = fields.findIndex((f) => f.n === "created_at");
  const insertAt = createdAtIdx === -1 ? fields.length : createdAtIdx;

  if (AUDIT_FIELD_TABLES.has(tbl.id)) {
    const toInsert = [
      { n: "created_by", t: "uuid", f: ["FK", "new"], no: "→ users.id — genel revizyonda eklendi (audit/hesap verebilirlik)" },
    ];
    if (fields.some((f) => f.n === "updated_at")) {
      toInsert.push({ n: "updated_by", t: "uuid", f: ["FK", "new"], no: "→ users.id — genel revizyonda eklendi" });
    }
    fields.splice(insertAt, 0, ...toInsert);
  }

  if (SOFT_DELETE_TABLES.has(tbl.id)) {
    fields.push({ n: "deleted_at", t: "timestamptz", f: ["new"], no: "NULL = aktif; doluysa soft-delete edilmiş — genel revizyonda eklendi" });
  }
}

PG_GROUPS.forEach((group) => group.tables.forEach(injectSystemFields));

/* ============================================================
   DBML EXPORT — dbdiagram.io'ya yapıştırılabilir companion dosya
   ============================================================
   Elle ikinci bir ilişki listesi tutmuyoruz: her alanın "no" (not)
   metnindeki "→ tablo.id" kalıbından Ref satırları otomatik çıkarılır.
   Birden fazla "→ x.id" içeren polimorfik alanlar (örn.
   permissions.catalog_item_id) bilinçli olarak atlanır — DBML tek
   hedefli FK'yı ifade edebilir, polimorfik referansı edemez.
*/
function dbmlEscape(s) {
  return String(s ?? "").replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function buildDbml() {
  const lines = [];
  lines.push("// Otomatik üretildi — scripts/generate-docs.mjs içindeki şema verisinden.");
  lines.push("// Elle düzenlemeyin; kaynağı değiştirip `node scripts/generate-docs.mjs` çalıştırın.");
  lines.push("// dbdiagram.io'da açmak için: bu dosyanın içeriğini kopyalayıp dbdiagram.io'da yeni diyagrama yapıştırın.");
  lines.push("");

  const refs = [];

  PG_GROUPS.forEach((group) => {
    group.tables.forEach((tbl) => {
      if (tbl.migrated) return;
      lines.push(`Table ${tbl.id.replace(/-/g, "_")} {`);
      tbl.fields.forEach((f) => {
        const attrs = [];
        if (f.f && f.f.includes("PK")) attrs.push("pk");
        if (f.f && f.f.includes("UNIQUE")) attrs.push("unique");
        if (f.f && f.f.includes("NN")) attrs.push("not null");
        const isNew = f.f && f.f.includes("new");
        const noteText = f.no ? `${isNew ? "(YENİ) " : ""}${f.no}` : (isNew ? "(YENİ)" : "");
        if (noteText) attrs.push(`note: "${dbmlEscape(noteText)}"`);
        const attrStr = attrs.length ? ` [${attrs.join(", ")}]` : "";
        lines.push(`  ${f.n} ${f.t}${attrStr}`);

        if (f.f && f.f.includes("FK") && f.no) {
          const matches = [...f.no.matchAll(/→\s*([a-zA-Z_]+)\.id\b/g)];
          if (matches.length === 1) {
            const targetTable = matches[0][1].replace(/-/g, "_");
            refs.push(`Ref: ${tbl.id.replace(/-/g, "_")}.${f.n} > ${targetTable}.id`);
          }
        }
      });
      lines.push("}");
      lines.push("");
    });
  });

  lines.push("// ---- İlişkiler (alan notlarından otomatik çıkarıldı) ----");
  lines.push(...refs);
  lines.push("");

  lines.push("// ---- Gruplar — dbdiagram.io/dbdocs.io'da renkli kutular olarak görünür ----");
  PG_GROUPS.forEach((group) => {
    const realTables = group.tables.filter((t) => !t.migrated).map((t) => t.id.replace(/-/g, "_"));
    if (!realTables.length) return;
    lines.push(`TableGroup "${group.label}" {`);
    realTables.forEach((name) => lines.push(`  ${name}`));
    lines.push("}");
    lines.push("");
  });

  return lines.join("\n") + "\n";
}

writeDoc(join(__dirname, "..", "static", "schema.dbml"), buildDbml());

/* ============================================================
   MONGODB VERİ MODELİ
   ============================================================ */

const MONGO_COLLECTIONS = [
  {
    id: "ai-conversations", displayName: "ai_conversations", position: 2,
    note: "AI konuşmasının Mongo tarafındaki metadata belgesi — sadece liste ekranını beslemek için var, mesaj içeriği taşımaz. Postgres'teki `ai_conversations` ile aynı id'yi paylaşır (uygulama seviyesinde eşleşir, DB seviyesinde FK yoktur).",
    model: "REFERENCE — mesaj gövdesinden ayrık, sabit boyutlu belge",
    why: [
      "Konuşma listesi ekranı (sol panel: 'son konuşmalarım') sadece başlık + son mesaj zamanını okur; mesaj gövdesini her seferinde taşımak bu sorguyu gereksiz yere ağırlaştırır.",
      "message_count ve last_bucket_seq alanları sayesinde uygulama, yeni mesaj eklerken hangi bucket'a yazacağına (ya da yeni bucket mı açacağına) tek bu belgeye bakarak karar verir.",
      "Postgres'teki thin `ai_conversations` tablosuyla birebir aynı id'yi taşır — iki taraf arasındaki tek bağ budur, cross-database FK yoktur.",
    ],
    schemaFields: [
      { n: "_id", t: "ObjectId" },
      { n: "tenant_id", t: "string (uuid)" },
      { n: "user_id", t: "string (uuid)" },
      { n: "title", t: "string" },
      { n: "started_at", t: "date" },
      { n: "last_message_at", t: "date" },
      { n: "is_archived", t: "bool" },
      { n: "message_count", t: "int" },
      { n: "last_bucket_seq", t: "int", no: "şu anda yazılan açık bucket'ın sırası" },
    ],
    example: `{
  "_id": ObjectId("66a1f2..."),
  "tenant_id": "8f3c1a20-...-uuid",
  "user_id": "2b77e410-...-uuid",
  "title": "Bu ayki kapanan deal analizi",
  "started_at": ISODate("2026-08-01T09:12:00Z"),
  "last_message_at": ISODate("2026-08-01T09:12:04Z"),
  "is_archived": false,
  "message_count": 2,
  "last_bucket_seq": 0
}`,
    validation: `db.createCollection("ai_conversations", {
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
});`,
    indexes: [
      "{ tenant_id: 1, user_id: 1, last_message_at: -1 }  — kullanıcının konuşma listesi, en yeni önce",
      "{ tenant_id: 1, is_archived: 1 }  — arşiv filtreleme",
    ],
    queries: [
      {
        title: "Kullanıcının son 20 konuşmasını getir (arşiv hariç)",
        code: `db.ai_conversations.find(
  { tenant_id: tenantId, user_id: userId, is_archived: false }
).sort({ last_message_at: -1 }).limit(20);`,
      },
      {
        title: "Bir tenant'ın toplam aktif konuşma sayısı",
        code: `db.ai_conversations.countDocuments(
  { tenant_id: tenantId, is_archived: false }
);`,
      },
    ],
  },
  {
    id: "ai-message-buckets", displayName: "ai_message_buckets", position: 3,
    note: "Bir konuşmanın mesajlarını, tool_call ve ui_widget'larıyla birlikte gömen ama SINIRSIZ büyümesini engelleyen koleksiyon. Her belge en fazla 50 mesaj taşır — dolunca yeni bir bucket (bucket_seq: 0, 1, 2…) açılır. Bu, MongoDB'nin bilinen **Bucket Pattern** desenidir; sohbet/zaman-serisi verisinde düz (sınırsız) embedding'in yerini alır.",
    model: "EMBED + BUCKET — sabit üst sınırlı gruplar halinde gömülü diziler",
    why: [
      "Bir AI konuşması teorik olarak sınırsız mesaj içerebilir (power-user oturumları 500+ mesaja çıkabilir). Bunu tek belgede düz bir diziye gömmek, belgeyi MongoDB'nin 16MB BSON limitine yaklaştırır ve her yeni mesajda tüm belgenin yeniden yazılma/taşınma riskini artırır.",
      "Bucket Pattern ile her belge sabit üst sınırlı kalır (≤50 mesaj); yeni mesaj çoğunlukla sadece açık olan son bucket'a `$push` ile eklenir — sabit boyutlu belgeler WiredTiger için daha öngörülebilir sayfalama sağlar.",
      "'Son N mesajı getir' sorgusu (en sık kullanılan ekran) = sadece son bucket'ı çek. 'Tüm geçmişi getir' = conversation_id'ye göre bucket_seq sırasıyla tüm bucket'ları çek — ikisi de JOIN gerektirmez.",
    ],
    schemaFields: [
      { n: "_id", t: "ObjectId" },
      { n: "conversation_id", t: "string (uuid)", no: "→ Postgres ai_conversations.id (app-level referans)" },
      { n: "tenant_id", t: "string (uuid)" },
      { n: "bucket_seq", t: "int", no: "0'dan başlar, her yeni bucket +1" },
      { n: "first_seq", t: "int", no: "bu bucket'taki ilk mesajın global sırası" },
      { n: "last_seq", t: "int", no: "bu bucket'taki son mesajın global sırası" },
      { n: "message_count", t: "int", no: "≤ 50, dolunca yeni bucket açılır" },
      { n: "messages", t: "array<object>", no: "gömülü dizi — bkz. örnek belge; her mesaj seq, sender_type, content, opsiyonel tool_calls[] ve ui_widgets[] taşır" },
    ],
    example: `{
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
}`,
    validation: `db.createCollection("ai_message_buckets", {
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
});`,
    indexes: [
      "{ conversation_id: 1, bucket_seq: 1 }  — UNIQUE, bucket'ları sırayla okumak için",
      "{ tenant_id: 1, conversation_id: 1 }  — tenant izolasyonu + hızlı erişim",
    ],
    queries: [
      {
        title: "Bir konuşmanın son bucket'ını getir (ekranda gösterilecek son mesajlar)",
        code: `db.ai_message_buckets.find(
  { conversation_id: conversationId }
).sort({ bucket_seq: -1 }).limit(1);`,
      },
      {
        title: "Tüm konuşma geçmişini sırayla getir",
        code: `db.ai_message_buckets.find(
  { conversation_id: conversationId }
).sort({ bucket_seq: 1 });`,
      },
    ],
  },
  {
    id: "audit-log", displayName: "audit_log", position: 4,
    note: "Postgres'teki `audit_log` tablosunun yerini tamamen alan koleksiyon. Gerekçe: append-only, çok yüksek yazma hacmi, `changes` alanı zaten serbest yapı — Postgres'te bu tablo büyüdükçe index bakımı ve vacuum maliyeti artar; Mongo'da hem TTL index ile otomatik temizlenebilir hem de tenant bazlı sharding'e daha uygundur.",
    model: "REFERENCE / APPEND-ONLY — birebir taşıma, TTL ile kendi kendini temizler",
    why: [
      "changes alanı entity_type'a göre tamamen farklı şekiller alır — şema zaten esnek olmak zorunda.",
      "Neredeyse hiç UPDATE yok, sadece INSERT ve zaman zaman range sorgusu — Mongo'nun rahat ettiği yazma deseni.",
      "Shard key adayı: `{ tenant_id: hashed }` — büyük/gürültülü bir tenant'ın audit hacmi diğer tenant'ların sorgu performansını etkilemez.",
      "TTL index ile eski kayıtları otomatik süpürmek (örn. 2 yıl sonra) tek satırlık bir index tanımından ibaret.",
    ],
    schemaFields: [
      { n: "_id", t: "ObjectId" },
      { n: "tenant_id", t: "string (uuid)" },
      { n: "user_id", t: "string (uuid) | null" },
      { n: "action", t: "string", no: "create/update/delete" },
      { n: "entity_type", t: "string" },
      { n: "entity_id", t: "string (uuid)" },
      { n: "changes", t: "object", no: "serbest yapı, entity_type'a göre değişir" },
      { n: "created_at", t: "date" },
    ],
    example: `{
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
}`,
    validation: `db.createCollection("audit_log", {
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
});`,
    indexes: [
      "{ tenant_id: 1, entity_type: 1, entity_id: 1 }  — 'bu kaydın geçmişi' sorgusu",
      "{ created_at: 1 }, expireAfterSeconds: 63072000  — TTL index, 2 yıl sonra otomatik silme",
    ],
    queries: [
      {
        title: "Bir kaydın (örn. bir deal) tüm değişiklik geçmişi, en yeni önce",
        code: `db.audit_log.find(
  { tenant_id: tenantId, entity_type: "deal", entity_id: dealId }
).sort({ created_at: -1 });`,
      },
      {
        title: "Bu ay en çok değişen 5 entity_type (aggregate)",
        code: `db.audit_log.aggregate([
  { $match: { tenant_id: tenantId, created_at: { $gte: startOfMonth } } },
  { $group: { _id: "$entity_type", changeCount: { $sum: 1 } } },
  { $sort: { changeCount: -1 } },
  { $limit: 5 },
]);`,
      },
    ],
  },
  {
    id: "activities", displayName: "activities", position: 5,
    note: "Postgres'teki `activities` tablosunun yerini ALMAZ — aynı verinin MongoDB'de nasıl modellenebileceğini gösteren, opsiyonel/alternatif bir model. activity_type'a göre şeklen değişen ek alanlar (`details`) taşıyabilir. Büyük ölçekli veya çok tipli (call/email/whatsapp/meeting…) tenant'lar için değerlendirilir.",
    model: "COEXISTENCE — Postgres ile aynı anda değil, ihtiyaç halinde alternatif",
    why: [
      "activity_type'a göre alan seti gerçekten farklılaşıyor (call ≠ email ≠ meeting) — çok sayıda NULL kolon açmak yerine tipe özel gömülü obje (`details`) kullanılıyor.",
      "Timeline görünümü zaten 'bu entity'nin tüm activity'lerini sırayla getir' şeklinde okunuyor — JOIN gerektirmeyen bir erişim deseni, Mongo'nun rahat ettiği yer.",
      "İleride yeni bir activity_type eklemek (örn. 'whatsapp_message') şema migration'ı gerektirmez; details.* içinde yeni bir alan açmak yeterlidir.",
    ],
    schemaFields: [
      { n: "_id", t: "ObjectId" },
      { n: "tenant_id", t: "string (uuid)" },
      { n: "entity_type", t: "string", no: "örn. 'deal', 'contact'" },
      { n: "entity_id", t: "string (uuid)" },
      { n: "activity_type", t: "string", no: "call/email/note/meeting" },
      { n: "subject", t: "string" },
      { n: "content", t: "string" },
      { n: "created_by", t: "string (uuid)" },
      { n: "created_at", t: "date" },
      { n: "details", t: "object", no: "activity_type'a göre değişen serbest alanlar" },
    ],
    example: `{
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
}`,
    validation: `db.createCollection("activities", {
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
});`,
    indexes: [
      "{ tenant_id: 1, entity_type: 1, entity_id: 1, created_at: -1 }  — bir kaydın timeline'ı, en yeni önce",
    ],
    queries: [
      {
        title: "Bir contact'ın timeline'ı, en yeni önce",
        code: `db.activities.find(
  { tenant_id: tenantId, entity_type: "contact", entity_id: contactId }
).sort({ created_at: -1 });`,
      },
      {
        title: "activity_type dağılımı (aggregate)",
        code: `db.activities.aggregate([
  { $match: { tenant_id: tenantId } },
  { $group: { _id: "$activity_type", count: { $sum: 1 } } },
  { $sort: { count: -1 } },
]);`,
      },
    ],
  },
  {
    id: "custom-field-values", displayName: "custom_field_values", position: 6,
    note: "Postgres'teki `custom_fields` jsonb kolonuna (companies, contacts, deals, projects'e tekrar tekrar eklenmiş) alternatif, merkezi bir EAV modeli. Her entity_type/entity_id çifti için tek belge, `values` altında tenant'ın custom_field_definitions'ta tanımladığı serbest anahtarları taşır.",
    model: "REFERENCE / EAV — merkezi, wildcard-indexli dinamik alan deposu",
    why: [
      "Postgres'te custom_fields jsonb kolonu her entity tablosuna ayrı ayrı eklenmiş durumda; burada tek koleksiyonda entity_type ile ayrıştırılıp merkezi yönetiliyor.",
      "Wildcard index (`$**`) sayesinde tenant'lar istediği yeni alanı tanımladığında manuel index eklemeye gerek kalmıyor — Postgres'te sık sorgulanan yeni bir jsonb anahtarı için genelde ayrı bir expression index eklemek gerekir.",
      "Bu koleksiyon opsiyoneldir: küçük/orta ölçekli tenant'lar için Postgres'teki jsonb kolonu yeterlidir. Custom field sayısı ve sorgu çeşitliliği arttıkça bu modele geçiş değerlendirilir.",
    ],
    schemaFields: [
      { n: "_id", t: "ObjectId" },
      { n: "tenant_id", t: "string (uuid)" },
      { n: "entity_type", t: "string", no: "örn. 'deal', 'contact', 'company'" },
      { n: "entity_id", t: "string (uuid)" },
      { n: "values", t: "object", no: "tenant'a özel dinamik anahtarlar, serbest yapı" },
      { n: "updated_at", t: "date" },
    ],
    example: `{
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
}`,
    validation: `db.createCollection("custom_field_values", {
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
db.custom_field_values.createIndex({ "values.$**": 1 });`,
    indexes: [
      "{ tenant_id: 1, entity_type: 1, entity_id: 1 }  — UNIQUE, bir kaydın tek belgesi",
      '{ "values.$**": 1 }  — wildcard index, hangi custom field eklenirse eklensin otomatik indekslenir',
    ],
    queries: [
      {
        title: "Bir deal'in custom field değerlerini getir",
        code: `db.custom_field_values.findOne(
  { tenant_id: tenantId, entity_type: "deal", entity_id: dealId }
);`,
      },
      {
        title: "Belirli bir dinamik alana göre filtrele (wildcard index kullanır)",
        code: `db.custom_field_values.find(
  { tenant_id: tenantId, "values.partner_channel": "reseller" }
);`,
      },
    ],
  },
  {
    id: "llm-call-log", displayName: "llm_call_log", position: 7,
    note: "Her mini/ana LLM çağrısının ham kaydı — hangi tenant/kullanıcı, hangi amaçla (niyet tespiti / UI üretimi / tool call), hangi Bedrock modeli, kaç token, ne maliyet. `tenant_token_usage` (Postgres) buradan değil, çağrı anında atomic olarak güncellenir — bu koleksiyon sadece detaylı log/analiz için.",
    model: "APPEND-ONLY — yüksek hacim, tenant_token_usage'ın ham kaynağı değil paralel logu",
    why: [
      "Her istek 2+ LLM çağrısı üretebiliyor (mini LLM + ana LLM + tool call'lar) — bu hacimde bir logu Postgres'te tutmak index/vacuum maliyetini gereksiz artırır, tıpkı audit_log'daki gerekçeyle aynı.",
      "purpose alanına göre kayıt şekli hafifçe değişir (örn. tool_call'da tool_name olur, ui_generation'da seçilen component olur) — şema zaten esnek olmak zorunda.",
      "Engellenen edge case — yanlış faturalama/açıklanamayan maliyet farkı: status alanı olmadan başarısız/timeout olan çağrılar da tenant_token_usage'a yansırdı — tenant hiç kullanmadığı token için kesinti görüp haklı olarak itiraz ederdi. was_fallback olmadan da 'bu ay neden daha pahalı' sorusuna cevap veremezdik (fallback modeli genelde farklı fiyatlanır).",
      "Engellenen edge case — fiyat değişince geçmiş maliyetin bozulması: cost_usd, o çağrı anında model_pricing'den (Postgres) okunan fiyatla hesaplanıp burada donmuş (frozen) olarak saklanır — fiyat sonradan değişse bile geçmiş kayıt yeniden hesaplanmış gibi görünmez.",
      "model_id, ham Bedrock string'i yerine Postgres models.id'sine referans veriyor — sağlayıcı model ismini değiştirirse (versiyon güncellemesi vb.) burada milyonlarca satırı geriye dönük güncellemek gerekmez, tek nokta (models tablosu) güncellenir.",
    ],
    schemaFields: [
      { n: "_id", t: "ObjectId" },
      { n: "tenant_id", t: "string (uuid)" },
      { n: "user_id", t: "string (uuid)" },
      { n: "request_id", t: "string", no: "aynı kullanıcı isteğine ait çağrıları gruplamak için" },
      { n: "purpose", t: "string", no: "intent_detection / ui_generation / tool_call" },
      { n: "model_id", t: "string (uuid)", no: "→ Postgres models.id — ham Bedrock string'i değil, kendi sabit id'miz (app-level referans)" },
      { n: "was_fallback", t: "bool", no: "birincil model hata verip fallback'e mi düşüldü" },
      { n: "status", t: "string", no: "success / failed / timeout" },
      { n: "input_tokens", t: "int" },
      { n: "output_tokens", t: "int" },
      { n: "cost_usd", t: "decimal", no: "çağrı anındaki fiyatla donmuş (frozen) maliyet" },
      { n: "latency_ms", t: "int" },
      { n: "created_at", t: "date" },
    ],
    example: `{
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
}`,
    validation: `db.createCollection("llm_call_log", {
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
});`,
    indexes: [
      "{ tenant_id: 1, created_at: -1 }  — tenant'ın son çağrıları / maliyet raporu",
      "{ request_id: 1 }  — tek bir kullanıcı isteğine ait tüm çağrıları toplama",
      "{ tenant_id: 1, status: 1, created_at: -1 }  — başarısız çağrı analizi",
    ],
    queries: [
      {
        title: "Bu ay tenant başına toplam maliyet (aggregate) — pre-flight gate'in kaynağı",
        code: `db.llm_call_log.aggregate([
  { $match: { tenant_id: tenantId, status: "success", created_at: { $gte: startOfMonth } } },
  { $group: {
      _id: "$tenant_id",
      totalCostUsd: { $sum: "$cost_usd" },
      totalInputTokens: { $sum: "$input_tokens" },
      totalOutputTokens: { $sum: "$output_tokens" },
  } },
]);`,
      },
      {
        title: "Başarısız çağrı oranı, amaca göre kırılım",
        code: `db.llm_call_log.aggregate([
  { $match: { tenant_id: tenantId, created_at: { $gte: startOfMonth } } },
  { $group: {
      _id: { purpose: "$purpose", status: "$status" },
      count: { $sum: 1 },
  } },
]);`,
      },
    ],
  },
];

/* ============================================================
   RENDER — PostgreSQL
   ============================================================ */

for (const group of PG_GROUPS) {
  writeDoc(
    join(DOCS, "postgres", group.dir, "_category_.json"),
    // Alt gruplar başlangıçta kapalı — sidebar ilk açılışta sade görünsün,
    // ilgilenen grup başlığına tıklayınca açılsın.
    JSON.stringify({ label: group.label, position: group.position, collapsed: true }, null, 2) + "\n"
  );

  for (const tbl of group.tables) {
    const slug = tbl.id;
    const title = tbl.displayName || tbl.id;

    if (tbl.migrated) {
      const md = `---
sidebar_position: ${tbl.position}
title: ${title}
${whyFrontmatter(tbl.why)}---

# ${title}

## Neden MongoDB'ye taşındı

:::tip MongoDB'ye taşındı
${tbl.note}

**[${tbl.mongoLabel} →](${tbl.mongoRef})**
:::
`;
      writeDoc(join(DOCS, "postgres", group.dir, `${slug}.md`), md);
      continue;
    }

    const md = `---
sidebar_position: ${tbl.position}
title: ${title}
${whyFrontmatter(tbl.why)}---

import CopyCodeButton from '@site/src/components/CopyCodeButton';

# ${title}

\`POSTGRESQL\` · ${group.label}

${tbl.note}
${tbl.why ? `\n_"Neden bu şekilde tasarlandı" gerekçeleri sağdaki (mobilde başlığın altındaki) bilgi kartında._\n` : ""}
## Alanlar

${fieldsTable(tbl.fields)}
${idxList(tbl.idx)}
<CopyCodeButton code={${JSON.stringify(buildCreateTableSql(tbl))}} label="📋 CREATE TABLE SQL'ini Kopyala" />
${tbl.example ? `\n## Örnek Satır (JSON gösterimi)\n\n\`\`\`json\n${JSON.stringify(tbl.example, null, 2)}\n\`\`\`\n` : ""}`;
    writeDoc(join(DOCS, "postgres", group.dir, `${slug}.md`), md);
  }
}

// Postgres kategori kök sırası
writeDoc(
  join(DOCS, "postgres", "_category_.json"),
  JSON.stringify({ label: "PostgreSQL", position: 2, collapsed: false }, null, 2) + "\n"
);

/* ============================================================
   RENDER — MongoDB
   ============================================================ */

writeDoc(
  join(DOCS, "mongodb", "_category_.json"),
  JSON.stringify({ label: "MongoDB", position: 3, collapsed: false }, null, 2) + "\n"
);

function buildMongoSeedScript(col) {
  return `// ${col.displayName} — mongosh seed script (otomatik üretildi, elle düzenlemeyin)\n${col.validation}\n\ndb.${col.displayName}.insertOne(${col.example});`;
}

const mongoSeedScripts = [];

for (const col of MONGO_COLLECTIONS) {
  const idxMd = col.indexes.map((i) => `- \`${i}\``).join("\n");
  const seedScript = buildMongoSeedScript(col);
  mongoSeedScripts.push(seedScript);
  const queriesMd = (col.queries || [])
    .map((q) => `### ${q.title}\n\n\`\`\`js\n${q.code}\n\`\`\``)
    .join("\n\n");

  const md = `---
sidebar_position: ${col.position}
title: ${col.displayName}
${whyFrontmatter(col.why)}---

import CopyCodeButton from '@site/src/components/CopyCodeButton';

# ${col.displayName}

\`MONGODB\` · ${col.model}

${col.note}

_"Neden bu şekilde tasarlandı" gerekçeleri sağdaki (mobilde başlığın altındaki) bilgi kartında._

<CopyCodeButton code={${JSON.stringify(seedScript)}} label="📋 Seed Script'ini Kopyala (mongosh)" />

Kopyaladığınızı Compass'ın veya Atlas Data Explorer'ın gömülü mongosh kabuğuna yapıştırın — koleksiyon, validasyon kuralları ve örnek belgeyle birlikte anında oluşur.

## Alan Şeması (beklenen — zorunlu değil)

${fieldsTable(col.schemaFields)}

## Örnek Belge

\`\`\`json
${col.example}
\`\`\`

## JSON Schema Validasyonu

\`\`\`js
${col.validation}
\`\`\`

## Önerilen İndeksler

${idxMd}
${queriesMd ? `\n## Örnek Sorgular\n\n${queriesMd}\n` : ""}`;
  writeDoc(join(DOCS, "mongodb", `${col.id}.md`), md);
}

writeDoc(
  join(__dirname, "..", "static", "mongo-seed.js"),
  `// Tüm MongoDB koleksiyonlarının seed script'i — otomatik üretildi.\n// Kullanım: mongosh'a (Compass/Atlas Data Explorer içindeki kabuk dahil) yapıştırın.\n\n` +
    mongoSeedScripts.join("\n\n")
);

console.log("\nTamamlandı.");
