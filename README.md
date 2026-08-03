# London News Monorepo

London News is structured as a small npm-workspaces monorepo. The production newsroom app lives in `apps/web`, while the repo root keeps shared docs and workspace commands.

The London News app combines:

- the public homepage, article, and category templates
- dedicated topic pages beneath major desks
- a public classifieds section with submission and seller-facing listing pages
- a role-aware admin shell for JMHV, super admins, editors, journalists, and guest writers
- homepage curation with draft, preview, publish, and schedule workflow
- a structured article editor with revision history and preview-ready body blocks
- editorial category management with top-nav controls, parent/child taxonomy, and a public sections index
- classifieds moderation with review, publish, reject, and featured-listing controls
- site-wide search across articles, desks, topics, classifieds, and public information pages
- persisted newsletter signups, public contact capture, and moderated classifieds enquiries
- Prisma models and seed data for a runnable local demo
- Vercel-ready deployment wiring with Postgres, Blob uploads, Redis rate limiting, readiness probes, and cron publishing

## Monorepo Layout

- `apps/web` main Next.js newsroom app
- `docs` deployment, operations, and developer notes
- `.refs` imported reference material used during the build

## Stack

- Next.js Pages Router
- TypeScript
- Tailwind CSS
- Prisma ORM
- NextAuth credentials login
- PostgreSQL across local, preview, and production
- Vercel Blob for newsroom media uploads
- Upstash Redis-backed rate limiting

## Quick Start

1. Copy `apps/web/.env.example` to `apps/web/.env`.
2. Install dependencies: `npm install`
3. Start the local PostgreSQL container: `npm run db:start`
4. Create the local database and seed demo content: `npm run db:setup`
5. Start the app: `npm run dev`
6. Open [http://localhost:3000](http://localhost:3000)

Local Postgres defaults are defined in [apps/web/.env.example](/Users/sam/Documents/LondonNews/apps/web/.env.example) and [docker-compose.yml](/Users/sam/Documents/LondonNews/docker-compose.yml).

## Local Demo Logins

These credentials are for local seeded development environments only. Hosted environments should use managed newsroom accounts created through `/admin/users`.

All local demo accounts use `LondonNews123!`:

- Super Admin: `superadmin@londonnews.local`
- JMHV: `jmhv@londonnews.local`
- Editor 1: `editor1@londonnews.local`
- Editor 2: `editor2@londonnews.local`
- Journalist 1: `journalist1@londonnews.local`
- Journalist 2: `journalist2@londonnews.local`
- Guest Writer 1: `guestwriter1@londonnews.local`
- Guest Writer 2: `guestwriter2@londonnews.local`

## Included Flows

- Public homepage powered by `Homepage -> HomepageSection -> HomepageSlot`
- Public article, category, and topic pages backed by Prisma query helpers
- Public classifieds listing, detail, and submission flow
- Guest writer registration and login
- Live London mood survey widget with persisted daily vote totals
- Article drafting, review submission, publish controls, and revision history
- Classifieds desk with draft, review, publish, reject, and expiry workflow
- Homepage desk with article picker, slot overrides, version history, preview, publish, and scheduling
- Category desk with taxonomy editing, parent/child relationships, nav visibility, and section SEO fields
- Audience workflows for newsletter signup, contact messages, and classified enquiries
- Public API routes for homepage, article, category, classifieds, and search payloads

## Important Routes

- `/` public homepage
- `/articles/[slug]` article detail
- `/category/[slug]` category page
- `/topics/[slug]` topic page
- `/classifieds` classifieds index
- `/classifieds/[slug]` listing detail
- `/classifieds/submit` public submission form
- `/sections` public sections index
- `/login` newsroom login
- `/admin` admin dashboard
- `/admin/articles` story desk
- `/admin/classifieds` classifieds desk
- `/admin/categories` category desk
- `/admin/homepage` homepage desk
- `/preview/homepage/[token]` secret homepage preview

## Handoff Notes

- Root `npm run ...` commands forward into the `@londonnews/web` workspace, so the developer can still work from the monorepo root.
- The repo now uses a single PostgreSQL Prisma schema at [apps/web/prisma/schema.prisma](/Users/sam/Documents/LondonNews/apps/web/prisma/schema.prisma) for local, preview, and production.
- For production hosting, run `npm run db:migrate:deploy` against the PostgreSQL `DIRECT_URL`, then build with `npm run build`.
- Public APIs fail closed when the database or active homepage is unavailable; they no longer serve demo content in hosted environments.
- The Vercel project root should be `apps/web`, with cron configured via [apps/web/vercel.json](/Users/sam/Documents/LondonNews/apps/web/vercel.json) and authenticated with `CRON_SECRET`.
- The homepage admin and preview workflow are taken from the provided London News reference bundles and wrapped in a full working project.
- The article CMS now uses structured body blocks, persisted revisions, and database-backed search. Remaining work is around deeper workflow maturity, not replacing a placeholder editor.

## Handoff Pack

- [Developer Handoff](./docs/HANDOFF.md)
- [Developer Handoff Note](./docs/DEVELOPER-HANDOFF-NOTE.md)
- [Deployment Checklist](./docs/DEPLOYMENT.md)
- [Staging Dry-Run Checklist](./docs/STAGING-CHECKLIST.md)
- [Vercel Environment Matrix](./docs/VERCEL-ENV-MATRIX.md)
- [Vercel Go-Live Runbook](./docs/VERCEL-GO-LIVE-RUNBOOK.md)
- [Open Items](./docs/OPEN-ITEMS.md)
