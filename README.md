# Pooja Sevak — Web app

The Next.js web app for **Pooja Sevak**, which lets a family book a verified pandit for a puja at home (pilot city: Lucknow) or live online. It talks to the NestJS API in the sibling `backend/` repo.

| | |
|---|---|
| Stack | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, shadcn/ui on Base UI |
| Port | **6002** |
| Language | Hindi first (default), English on request |
| Install | Installable PWA (manifest + service worker) |
| Runtime | Node.js 22 |

> This Next.js version has breaking changes from older releases. Read the guides in `node_modules/next/dist/docs/` before changing routing, caching or config (see `AGENTS.md`).

Product requirements, the API contract and the design system sit outside this repo, in the parent project folder:

- `Requirement.md`: product requirements and feature status
- `docs/API.md`: endpoint contract (shared shapes live in `src/lib/types.ts`)
- `docs/DESIGN.md`: the "Sandhya Aarti" design system (tokens, type, brand elements)
- `deploy/README.md`: production deployment

## Features

| Area | Routes |
|---|---|
| Public | Home, puja catalog (`/pujas`), pandit browse and profiles (`/browse`, `/pandits`), online pujas (`/online`), panchang, FAQ, about, contact, legal pages |
| Auth | Login, signup, Google sign-in (`/auth/callback`, `/auth/choose-role`), email and mobile verification, password reset |
| Customer | Booking flow (`/pandits/[id]/book`) with Razorpay checkout, bookings and booking chat, addresses, ritual reminders, account |
| Pandit | Dashboard, bookings, services and pricing, profile and KYC, payouts (`/pandit/*`) |
| Admin | Catalog, pandit verification, bookings, flagged chats, settlements, settings (`/admin/*`) |

## Getting started

### Easiest: run the whole app

From the parent folder, `./start.sh` installs dependencies, prepares the database, starts the backend and this app, and prints the URLs and demo sign-ins. `./stop.sh` stops everything.

### This repo on its own

The backend must be running on port 6001.

```bash
cp .env.local.example .env.local
npm install
npm run dev                      # http://localhost:6002
```

Demo sign-ins (seeded by the backend when `SEED_DEMO=true`):

| Role | Email | Password |
|---|---|---|
| Admin | admin@poojasevak.in | Admin@123 |
| Customer | bhakt@poojasevak.in | Bhakt@123 |
| Pandit | pt.mishra@poojasevak.in | Pandit@123 |

### Testing on a phone

Development traffic can go through a Cloudflare tunnel (`next.config.ts` allows `*.appme.in` dev origins). The API is called same-origin at `/v1`, so the tunnel needs no CORS setup.

## Configuration

| Variable | Used by | Purpose |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Browser (inlined at build) | API base. `/v1` (recommended) calls the API same-origin through the proxy; an absolute URL calls the API host directly |
| `API_INTERNAL_URL` | Next.js server | Where the server reaches the backend, for the `/v1` rewrite and server-side fetches. Default `http://localhost:6001/v1` |
| `NEXT_PUBLIC_SITE_URL` | Build | Public site URL for metadata, `robots.txt` and `sitemap.xml` |
| `MEDIA_IMG_ORIGIN` | Build | Allowed image origin for profile photos (defaults to the dev S3 bucket; set it to the prod bucket or a CDN) |

`NEXT_PUBLIC_*` values are baked in at build time, so changing them needs a rebuild.

## How it fits together

- **API proxy:** `next.config.ts` rewrites `/v1/*` to `API_INTERNAL_URL`. The browser never calls the backend cross-origin.
- **Auth:** `src/lib/auth-context.tsx` and `src/lib/session.ts` keep the short-lived access token in memory and renew it through the backend's httpOnly refresh cookie.
- **i18n:** `src/i18n` holds the messages, split by area under `messages/hi` and `messages/en`. The language comes from the `ps_locale` cookie, and `?lang=en|hi` overrides it for a single request. Every new string needs both a Hindi and an English entry. `src/i18n/GLOSSARY.md` fixes the Hindi terms to use.
- **Caching:** public data (catalog, panchang, business profile, SEO data) uses Next.js fetch revalidation. After an admin saves the business profile, `POST /api/revalidate/business-profile` refreshes it at once.
- **Security headers:** `next.config.ts` enforces a basic CSP (framing, base URI, plugins, form targets) and runs the full policy in report-only mode. HSTS is on in production.
- **PDF viewer:** samagri lists render with `pdfjs-dist`. `scripts/copy-pdfjs-assets.mjs` copies its fonts, CMaps and WASM into `public/pdfjs` on install, dev and build. Don't edit that folder by hand.

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Dev server on 6002 |
| `npm run build` | Production build (standalone output) |
| `npm start` | Serve the production build on 6002 |
| `npm run lint` | ESLint |

## Docker

The multi-stage `Dockerfile` builds the standalone server and runs it as a non-root user on port 6002. Pass the public values as build arguments:

```bash
docker build \
  --build-arg NEXT_PUBLIC_API_URL=/v1 \
  --build-arg NEXT_PUBLIC_SITE_URL=https://example.com \
  -t pooja-sevak-web .
```

Set `API_INTERNAL_URL` at runtime so the server can reach the backend (for example `http://backend:6001/v1` in Compose). The full stack is in `../deploy/docker-compose.prod.yml`.

## Project layout

```
src/
├── app/            routes (App Router): public, auth, customer, pandit/, admin/, api/
├── components/     ui/ (shadcn), brand/, booking/, pandit/, admin/, customer/, ritual/, seo/, …
├── i18n/           locale config, provider, messages/{hi,en}, GLOSSARY.md
└── lib/            API client, auth/session, types, formatting, Razorpay, SEO data
public/             icons, service worker (sw.js), pdfjs/ (generated)
scripts/            copy-pdfjs-assets.mjs
```

## Conventions

- Hindi is the default; ship every string in both languages.
- Use the design tokens from `docs/DESIGN.md` (`bg-primary`, `text-heading`, …), not hard-coded colours.
- Keep request and response types in `src/lib/types.ts` in step with the API.

Private project.
