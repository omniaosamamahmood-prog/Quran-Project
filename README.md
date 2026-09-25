# 📖 Quran Companion

### رفيق القرآن

> A calm, bilingual companion for reading the Mushaf, memorizing with intention, reviewing what you have learned, and keeping your place — all grounded in a trusted local Quran dataset.

<p align="center">
  <img src="docs/badges/nextjs.svg" alt="Next.js 16" height="28" />
  &nbsp;
  <img src="docs/badges/react.svg" alt="React 19" height="28" />
  &nbsp;
  <img src="docs/badges/typescript.svg" alt="TypeScript 5" height="28" />
  &nbsp;
  <img src="docs/badges/tailwind.svg" alt="Tailwind CSS 4" height="28" />
  &nbsp;
  <img src="docs/badges/supabase.svg" alt="Supabase" height="28" />
  &nbsp;
  <img src="docs/badges/i18n.svg" alt="i18n AR EN" height="28" />
</p>

<p align="center">
  <img src="docs/badges/license.svg" alt="License Private" height="22" />
  &nbsp;
  <img src="docs/badges/locales.svg" alt="Locales Arabic English" height="22" />
  &nbsp;
  <img src="docs/badges/quran.svg" alt="Quran Tanzil Uthmani" height="22" />
  &nbsp;
  <img src="docs/badges/status.svg" alt="Status Active" height="22" />
</p>

---

## ✨ Overview

**Quran Companion** is a modern web application built for a focused Quran journey:

| Focus | What it delivers |
| --- | --- |
| 📜 **Reading** | Page-authentic Mushaf experience with precise ayah anchors |
| 📌 **Progress** | Explicit “save reading position” — never auto-overwritten |
| 🎓 **Memorization** | Units: single ayah, Surah range, or full Mushaf page |
| 🔄 **Review** | Spaced self-rating for each memorized unit |
| ❤️ **Favorites** | Save meaningful ayahs for later reflection |
| 🌍 **Locales** | Full Arabic (RTL) & English (LTR) application UI |

Quran Arabic text is **always RTL**, resolved exclusively from the trusted local dataset — never generated, rewritten, or stored in the database.

---

## 🌟 Features

### 📖 Mushaf Reader
- Madinah Mushaf page layout with ornamental frame and ayah medallions
- Shared ayah-actions chrome (outside Quran text): Favorites · Save position · Memorization
- Deep links: `/{locale}/quran/page/{n}#ayah-{surah}-{ayah}`

### 📍 Continue Reading
- One saved position per authenticated user
- Explicit save only — opening a page does **not** update progress
- Home CTA resumes the exact Mushaf page and ayah

### 🧠 Memorization Units

| Unit | Meaning | Stored as |
| --- | --- | --- |
| **Ayah** | One verse | `unit_type = ayah` |
| **Range** | Contiguous ayahs in one Surah | `unit_type = range` (single row) |
| **Page** | Full Mushaf page (may span Surahs) | `unit_type = page` |

Workspace sections: **Currently memorizing** · **Memorized** · real unit stats (not inflated ayah counts).

### 🗂️ Review System
- One review schedule per memorization unit
- Reveal → self-rate: **Difficult** (+1 day) · **Good** (+3 days) · **Easy** (+7 days)
- Dashboard: overdue · due today · upcoming · start session

### 💖 Favorites
- Ayah-level favorites with RLS-protected Supabase storage
- Guest → locale-aware login with safe `next` return URL

### 🔐 Auth & Security
- Supabase Auth (SSR + browser cookie session)
- Row Level Security: users only access their own rows
- Never trusts client-supplied `user_id` · no `service_role` in app code
- Profiles created by signup trigger — features never invent profiles

---

## 🛠️ Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | [Next.js 16](https://nextjs.org) (App Router) |
| UI | [React 19](https://react.dev) · [Tailwind CSS 4](https://tailwindcss.com) |
| Language | [TypeScript 5](https://www.typescriptlang.org) |
| Auth & DB | [Supabase](https://supabase.com) (Postgres + Auth + RLS) |
| i18n | [next-intl](https://next-intl.dev) — `ar` (default) · `en` |
| Quran data | Local `data/quran.json` + `data/quran-pages.json` (Tanzil Uthmani) |

---

## 📁 Project Structure

```text
quran-project/
├── app/
│   ├── [locale]/          # Locale routes (home, quran, memorization, review, …)
│   ├── actions/           # Server actions (favorites, progress, memorization, review)
│   └── auth/              # Auth confirm callback
├── components/            # UI by domain (quran, memorization, review, home, …)
├── data/                  # Trusted Quran datasets (do not modify casually)
├── docs/badges/           # README badge SVGs (served from this repo)
├── i18n/                  # Routing + next-intl wiring
├── lib/                   # Domain helpers + Supabase clients + auth
├── messages/              # ar.json · en.json
├── scripts/               # Quran conversion tooling
├── supabase/              # RLS reference SQL (policies already applied remotely)
└── types/                 # Shared TypeScript models
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 20+ recommended
- **npm** (ships with Node)
- A **Supabase** project with Auth + the app tables / RLS already configured

### 1. Install

```bash
npm install
```

### 2. Environment

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_or_publishable_key
```

> Use the public/anon (publishable) key only. Do **not** put the service-role key in the frontend or Next app env for these features.

### 3. Develop

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — default locale is Arabic (`/ar`).

### 4. Quality checks

```bash
npx tsc --noEmit
npm run lint
npm run build
```

### 5. Production

```bash
npm run build
npm start
```

---

## 📦 Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Development server (Webpack) |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run convert:quran` | Regenerate local Quran JSON from source XML |

---

## 🛡️ Quran Data Safety

This project treats Quran text as sacred source material:

- Content comes **only** from the local trusted datasets
- **Do not** normalize, trim, rewrite, translate, or regenerate ayah text for storage
- **Do not** store Quran text in Supabase — store references only (`surah` / `ayah` / `page` / unit fields)
- Display Quran Arabic **RTL** in every locale

Attribution follows the Tanzil Uthmani edition embedded in the dataset metadata.

---

## 🗃️ Data Model (app-facing)

| Domain | Scope | Notes |
| --- | --- | --- |
| **Favorites** | Ayah | Still ayah-based |
| **Reading progress** | One position / user | Explicit save |
| **Memorization** | Unit (`ayah` \| `range` \| `page`) | One row = one unit |
| **Review** | Linked to `memorization.id` | One schedule per unit |

Reference SQL (not for casual re-runs) lives under `supabase/`.

---

## 🌐 Internationalization

| Locale | UI direction | Quran text |
| --- | --- | --- |
| `ar` (default) | RTL | RTL |
| `en` | LTR | RTL |

All product copy lives in `messages/ar.json` and `messages/en.json` via **next-intl**.

---

## 📝 Roadmap notes

Placeholders may still exist for areas such as listening experiences or Adhkar content expansion. Core reading, auth, favorites, progress, memorization units, and review are implemented end-to-end.

---

## 🙏 Acknowledgements

- **Tanzil** — Uthmani Quran text
- **Next.js** · **Supabase** · **next-intl** · **Tailwind CSS**

---

<p align="center">
  <strong>Quran Companion</strong> · <em>رفيق القرآن</em><br />
  <sub>Read · Memorize · Review · Reflect</sub>
</p>
