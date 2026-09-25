# <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Open%20Book.png" alt="Open Book" width="36" height="36" /> Quran Companion

### رفيق القرآن

> A calm, bilingual companion for reading the Mushaf, memorizing with intention, reviewing what you have learned, and keeping your place — all grounded in a trusted local Quran dataset.

<p align="center">
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=nextdotjs&logoColor=white" />
  <img alt="React" src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img alt="Tailwind CSS" src="https://img.shields.io/badge/Tailwind-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" />
  <img alt="Supabase" src="https://img.shields.io/badge/Supabase-Auth%20%26%20Postgres-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white" />
  <img alt="next-intl" src="https://img.shields.io/badge/i18n-AR%20%7C%20EN-0B4A34?style=for-the-badge&logo=googletranslate&logoColor=white" />
</p>

<p align="center">
  <img alt="License" src="https://img.shields.io/badge/License-Private-informational?style=flat-square" />
  <img alt="Locales" src="https://img.shields.io/badge/Locales-Arabic%20%7C%20English-success?style=flat-square" />
  <img alt="Quran Source" src="https://img.shields.io/badge/Quran-Tanzil%20Uthmani-0F7A52?style=flat-square" />
  <img alt="Status" src="https://img.shields.io/badge/Status-Active-brightgreen?style=flat-square" />
</p>

---

## <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Travel%20and%20places/Glowing%20Star.png" alt="Star" width="28" height="28" /> Overview

**Quran Companion** is a modern web application built for a focused Quran journey:

| Focus | What it delivers |
| --- | --- |
| <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Scroll.png" width="20" height="20" alt="" /> **Reading** | Page-authentic Mushaf experience with precise ayah anchors |
| <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Bookmark%20Tabs.png" width="20" height="20" alt="" /> **Progress** | Explicit “save reading position” — never auto-overwritten |
| <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Graduation%20Cap.png" width="20" height="20" alt="" /> **Memorization** | Units: single ayah, Surah range, or full Mushaf page |
| <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Counterclockwise%20Arrows%20Button.png" width="20" height="20" alt="" /> **Review** | Spaced self-rating for each memorized unit |
| <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Red%20Heart.png" width="20" height="20" alt="" /> **Favorites** | Save meaningful ayahs for later reflection |
| <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Globe%20Showing%20Europe-Africa.png" width="20" height="20" alt="" /> **Locales** | Full Arabic (RTL) & English (LTR) application UI |

Quran Arabic text is **always RTL**, resolved exclusively from the trusted local dataset — never generated, rewritten, or stored in the database.

---

## <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Sparkles.png" alt="Sparkles" width="28" height="28" /> Features

### <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Open%20Book.png" width="22" height="22" alt="" /> Mushaf Reader
- Madinah Mushaf page layout with ornamental frame and ayah medallions  
- Shared ayah-actions chrome (outside Quran text): Favorites · Save position · Memorization  
- Deep links: `/{locale}/quran/page/{n}#ayah-{surah}-{ayah}`

### <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Round%20Pushpin.png" width="22" height="22" alt="" /> Continue Reading
- One saved position per authenticated user  
- Explicit save only — opening a page does **not** update progress  
- Home CTA resumes the exact Mushaf page and ayah

### <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Brain.png" width="22" height="22" alt="" /> Memorization Units
| Unit | Meaning | Stored as |
| --- | --- | --- |
| **Ayah** | One verse | `unit_type = ayah` |
| **Range** | Contiguous ayahs in one Surah | `unit_type = range` (single row) |
| **Page** | Full Mushaf page (may span Surahs) | `unit_type = page` |

Workspace sections: **Currently memorizing** · **Memorized** · real unit stats (not inflated ayah counts).

### <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Card%20Index%20Dividers.png" width="22" height="22" alt="" /> Review System
- One review schedule per memorization unit  
- Reveal → self-rate: **Difficult** (+1 day) · **Good** (+3 days) · **Easy** (+7 days)  
- Dashboard: overdue · due today · upcoming · start session

### <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Growing%20Heart.png" width="22" height="22" alt="" /> Favorites
- Ayah-level favorites with RLS-protected Supabase storage  
- Guest → locale-aware login with safe `next` return URL

### <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Locked%20with%20Key.png" width="22" height="22" alt="" /> Auth & Security
- Supabase Auth (SSR + browser cookie session)  
- Row Level Security: users only access their own rows  
- Never trusts client-supplied `user_id` · no `service_role` in app code  
- Profiles created by signup trigger — features never invent profiles

---

## <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Hammer%20and%20Wrench.png" alt="Tools" width="28" height="28" /> Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | [Next.js 16](https://nextjs.org) (App Router) |
| UI | [React 19](https://react.dev) · [Tailwind CSS 4](https://tailwindcss.com) |
| Language | [TypeScript 5](https://www.typescriptlang.org) |
| Auth & DB | [Supabase](https://supabase.com) (Postgres + Auth + RLS) |
| i18n | [next-intl](https://next-intl.dev) — `ar` (default) · `en` |
| Quran data | Local `data/quran.json` + `data/quran-pages.json` (Tanzil Uthmani) |

---

## <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/File%20Folder.png" alt="Folder" width="28" height="28" /> Project Structure

```text
quran-project/
├── app/
│   ├── [locale]/          # Locale routes (home, quran, memorization, review, …)
│   ├── actions/           # Server actions (favorites, progress, memorization, review)
│   └── auth/              # Auth confirm callback
├── components/            # UI by domain (quran, memorization, review, home, …)
├── data/                  # Trusted Quran datasets (do not modify casually)
├── i18n/                  # Routing + next-intl wiring
├── lib/                   # Domain helpers + Supabase clients + auth
├── messages/              # ar.json · en.json
├── scripts/               # Quran conversion tooling
├── supabase/              # RLS reference SQL (policies already applied remotely)
└── types/                 # Shared TypeScript models
```

---

## <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Rocket.png" alt="Rocket" width="28" height="28" /> Getting Started

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

## <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Package.png" alt="Package" width="28" height="28" /> Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Development server (Webpack) |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run convert:quran` | Regenerate local Quran JSON from source XML |

---

## <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Shield.png" alt="Shield" width="28" height="28" /> Quran Data Safety

This project treats Quran text as sacred source material:

- Content comes **only** from the local trusted datasets  
- **Do not** normalize, trim, rewrite, translate, or regenerate ayah text for storage  
- **Do not** store Quran text in Supabase — store references only (`surah` / `ayah` / `page` / unit fields)  
- Display Quran Arabic **RTL** in every locale  

Attribution follows the Tanzil Uthmani edition embedded in the dataset metadata.

---

## <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Card%20File%20Box.png" alt="Database" width="28" height="28" /> Data Model (app-facing)

| Domain | Scope | Notes |
| --- | --- | --- |
| **Favorites** | Ayah | Still ayah-based |
| **Reading progress** | One position / user | Explicit save |
| **Memorization** | Unit (`ayah` \| `range` \| `page`) | One row = one unit |
| **Review** | Linked to `memorization.id` | One schedule per unit |

Reference SQL (not for casual re-runs) lives under `supabase/`.

---

## <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Travel%20and%20places/Globe%20Showing%20Asia-Australia.png" alt="Globe" width="28" height="28" /> Internationalization

| Locale | UI direction | Quran text |
| --- | --- | --- |
| `ar` (default) | RTL | RTL |
| `en` | LTR | RTL |

All product copy lives in `messages/ar.json` and `messages/en.json` via **next-intl**.

---

## <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Memo.png" alt="Memo" width="28" height="28" /> Roadmap notes

Placeholders may still exist for areas such as listening experiences or Adhkar content expansion. Core reading, auth, favorites, progress, memorization units, and review are implemented end-to-end.

---

## <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Folded%20Hands.png" alt="Thanks" width="28" height="28" /> Acknowledgements

- **Tanzil** — Uthmani Quran text  
- **Next.js** · **Supabase** · **next-intl** · **Tailwind CSS**  

---

<p align="center">
  <strong>Quran Companion</strong> · <em>رفيق القرآن</em><br />
  <sub>Read · Memorize · Review · Reflect</sub>
</p>
