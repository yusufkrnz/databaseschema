import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'Şema Referansı',
  tagline: 'AI-First CRM + ERP — PostgreSQL ve MongoDB şema dokümantasyonu',
  favicon: 'img/logo.png',

  future: {
    v4: true,
  },

  // GitHub Pages: kullanıcı adın "yusufkrnz", repo adı "databaseschema" varsayıldı.
  // Repo adın farklıysa hem url/baseUrl'i hem organizationName/projectName'i güncelle.
  url: 'https://yusufkrnz.github.io',
  baseUrl: '/databaseschema/',

  organizationName: 'yusufkrnz',
  projectName: 'databaseschema',
  deploymentBranch: 'gh-pages',
  trailingSlash: false,

  onBrokenLinks: 'throw',

  i18n: {
    defaultLocale: 'tr',
    locales: ['tr'],
  },

  markdown: {
    mermaid: true,
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },
  themes: ['@docusaurus/theme-mermaid'],
  plugins: [
    [
      '@easyops-cn/docusaurus-search-local',
      {
        hashed: true,
        language: ['tr', 'en'],
        indexDocs: true,
        indexBlog: false,
        indexPages: false,
        docsRouteBasePath: '/',
        highlightSearchTermsOnTargetPage: true,
        explicitSearchResultPath: true,
      },
    ],
  ],

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          routeBasePath: '/',
          editUrl: undefined,
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/logo.png',
    colorMode: {
      defaultMode: 'light',
      respectPrefersColorScheme: true,
    },
    docs: {
      sidebar: {
        autoCollapseCategories: true,
      },
    },
    navbar: {
      title: 'Şema Referansı',
      logo: {
        alt: 'Şema Referansı Logo',
        src: 'img/logo.png',
        href: '/intro',
      },
      items: [
        {to: '/intro', label: 'Genel Bakış', position: 'left'},
        {to: '/postgres/erd', label: 'PostgreSQL', position: 'left'},
        {to: '/mongodb/principles', label: 'MongoDB', position: 'left'},
        {to: '/architecture/security', label: 'Mimari İlkeler', position: 'left'},
        {to: '/relationships', label: 'İlişkiler', position: 'left'},
        {
          type: 'docSidebar',
          sidebarId: 'schemaSidebar',
          position: 'left',
          label: 'Tüm Tablolar',
        },
        {
          href: 'https://github.com/yusufkrnz/databaseschema',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'light',
      links: [
        {
          title: 'Dokümantasyon',
          items: [
            {label: 'Genel Bakış', to: '/intro'},
            {label: 'İlişkiler (Postgres + Mongo)', to: '/relationships'},
            {label: 'İlişki Diyagramı (ERD)', to: '/postgres/erd'},
            {label: 'Modelleme İlkeleri', to: '/mongodb/principles'},
          ],
        },
        {
          title: 'PostgreSQL',
          items: [
            {label: 'Core — Multi-tenant Çekirdek', to: '/postgres/core/tenants'},
            {label: 'CRM', to: '/postgres/crm/companies'},
            {label: 'ERP / İç Operasyon', to: '/postgres/erp/projects'},
            {label: 'Platform & Yetkilendirme', to: '/postgres/platform/permissions'},
          ],
        },
        {
          title: 'MongoDB',
          items: [
            {label: 'Modelleme İlkeleri', to: '/mongodb/principles'},
            {label: 'ai_message_buckets', to: '/mongodb/ai-message-buckets'},
            {label: 'audit_log', to: '/mongodb/audit-log'},
            {label: 'llm_call_log', to: '/mongodb/llm-call-log'},
          ],
        },
        {
          title: 'Mimari İlkeler',
          items: [
            {label: 'Güvenlik & İzolasyon', to: '/architecture/security'},
            {label: 'Maliyet Optimizasyonu', to: '/architecture/cost-optimization'},
            {label: 'Performans & Ölçekleme', to: '/architecture/performance'},
            {label: 'Güvenilirlik & Tutarlılık', to: '/architecture/reliability'},
          ],
        },
        {
          title: 'Proje',
          items: [
            {label: 'GitHub Reposu', href: 'https://github.com/yusufkrnz/databaseschema'},
          ],
        },
      ],
      copyright: `AI-First CRM + ERP · Şema Referansı — PostgreSQL 35 tablo, MongoDB 6 koleksiyon · ${new Date().getFullYear()}`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['json', 'sql', 'bash'],
    },
    mermaid: {
      theme: {light: 'neutral', dark: 'dark'},
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
