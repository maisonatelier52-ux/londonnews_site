# London News Developer Handoff

See also: [Developer Handoff Note](./DEVELOPER-HANDOFF-NOTE.md)

## What This Repo Is

This repository is an npm-workspaces monorepo for London News that combines:

- a public newsroom site
- dedicated topic pages beneath major editorial desks
- a public classifieds marketplace section
- an internal admin shell
- structured article drafting, review flow, and revision history
- classifieds submission and moderation flow
- homepage curation with preview, publish, and schedule controls
- editorial category management with public navigation wiring
- database-backed search across articles, desks, classifieds, and public pages
- persisted newsletter signups, public contact capture, and moderated classifieds enquiries
- local seed data so the next developer can run it immediately

The live app code sits in `apps/web`. It is a launch-capable v1 newsroom baseline with remaining work concentrated in workflow depth, commerce, notifications, and enterprise operations.

## Verified State

These commands were run successfully in this repo:

- `npm install`
- `npm run db:start`
- `npm run db:setup`
- `npm run typecheck`
- `npm run build`

Note: on this local machine, Prisma's `migrate` CLI database commands were blocked by the host Node 25 runtime, so the checked-in SQL migrations were applied directly to the local Docker Postgres container for verification. The release workflows use Node 22 and still run `npm run db:migrate:deploy` as the canonical path.

## Local Run

1. Copy `apps/web/.env.example` to `apps/web/.env`
2. Run `npm install`
3. Run `npm run db:start`
4. Run `npm run db:setup`
5. Run `npm run dev`
6. Open `http://localhost:3000`

The local database now lives in Docker-backed PostgreSQL rather than `apps/web/prisma/dev.db`.

## Local Demo Accounts

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

## Main Areas

### Public site

- `/`
- `/articles/[slug]`
- `/category/[slug]`
- `/topics/[slug]`
- `/classifieds`
- `/classifieds/[slug]`
- `/classifieds/submit`
- `/sections`
- `/preview/homepage/[token]`

### Admin

- `/login`
- `/register`
- `/admin`
- `/admin/articles`
- `/admin/articles/new`
- `/admin/classifieds`
- `/admin/classifieds/new`
- `/admin/categories`
- `/admin/homepage`
- `/admin/audience`
- `/admin/users`

## Core File Map

### App setup

- [package.json](../package.json)
- [apps/web/package.json](../apps/web/package.json)
- [apps/web/next.config.js](../apps/web/next.config.js)
- [apps/web/tailwind.config.js](../apps/web/tailwind.config.js)
- [apps/web/styles/globals.css](../apps/web/styles/globals.css)

### Auth

- [apps/web/pages/api/auth/[...nextauth].ts](../apps/web/pages/api/auth/[...nextauth].ts)
- [apps/web/pages/api/auth/register.ts](../apps/web/pages/api/auth/register.ts)
- [apps/web/types/next-auth.d.ts](../apps/web/types/next-auth.d.ts)

### Public data/query layer

- [apps/web/lib/cms/queries/homepage.ts](../apps/web/lib/cms/queries/homepage.ts)
- [apps/web/lib/cms/queries/article-by-slug.ts](../apps/web/lib/cms/queries/article-by-slug.ts)
- [apps/web/lib/cms/queries/category-by-slug.ts](../apps/web/lib/cms/queries/category-by-slug.ts)
- [apps/web/lib/cms/queries/classifieds.ts](../apps/web/lib/cms/queries/classifieds.ts)
- [apps/web/lib/cms/queries/homepage-preview.ts](../apps/web/lib/cms/queries/homepage-preview.ts)
- [apps/web/lib/cms/queries/navigation.ts](../apps/web/lib/cms/queries/navigation.ts)
- [apps/web/lib/categories/recommended-categories.ts](../apps/web/lib/categories/recommended-categories.ts)
- [apps/web/lib/categories/queries.ts](../apps/web/lib/categories/queries.ts)
- [apps/web/lib/taxonomy.ts](../apps/web/lib/taxonomy.ts)

### Homepage workflow

- [apps/web/pages/admin/homepage/index.tsx](../apps/web/pages/admin/homepage/index.tsx)
- [apps/web/pages/admin/homepage/[id].tsx](../apps/web/pages/admin/homepage/[id].tsx)
- [apps/web/lib/admin/homepage-utils.ts](../apps/web/lib/admin/homepage-utils.ts)
- [apps/web/lib/admin/homepage-workflow.ts](../apps/web/lib/admin/homepage-workflow.ts)

### Article workflow

- [apps/web/pages/admin/articles/index.tsx](../apps/web/pages/admin/articles/index.tsx)
- [apps/web/pages/admin/articles/new.tsx](../apps/web/pages/admin/articles/new.tsx)
- [apps/web/pages/admin/articles/[id].tsx](../apps/web/pages/admin/articles/[id].tsx)
- [apps/web/components/admin/ArticleEditor.tsx](../apps/web/components/admin/ArticleEditor.tsx)
- [apps/web/components/admin/StoryBlocksEditor.tsx](../apps/web/components/admin/StoryBlocksEditor.tsx)
- [apps/web/lib/articles/blocks.ts](../apps/web/lib/articles/blocks.ts)
- [apps/web/lib/articles/revisions.ts](../apps/web/lib/articles/revisions.ts)
- [apps/web/pages/api/admin/articles/index.ts](../apps/web/pages/api/admin/articles/index.ts)
- [apps/web/pages/api/admin/articles/[id].ts](../apps/web/pages/api/admin/articles/[id].ts)

### Search and audience workflows

- [apps/web/pages/search.tsx](../apps/web/pages/search.tsx)
- [apps/web/lib/search/query.ts](../apps/web/lib/search/query.ts)
- [apps/web/pages/api/public/search.ts](../apps/web/pages/api/public/search.ts)
- [apps/web/pages/api/public/subscribe.ts](../apps/web/pages/api/public/subscribe.ts)
- [apps/web/pages/api/public/contact.ts](../apps/web/pages/api/public/contact.ts)
- [apps/web/pages/api/public/classifieds/[slug]/enquire.ts](../apps/web/pages/api/public/classifieds/[slug]/enquire.ts)
- [apps/web/pages/admin/audience/index.tsx](../apps/web/pages/admin/audience/index.tsx)

### Classifieds workflow

- [apps/web/pages/classifieds/index.tsx](../apps/web/pages/classifieds/index.tsx)
- [apps/web/pages/classifieds/[slug].tsx](../apps/web/pages/classifieds/[slug].tsx)
- [apps/web/pages/classifieds/submit.tsx](../apps/web/pages/classifieds/submit.tsx)
- [apps/web/pages/admin/classifieds/index.tsx](../apps/web/pages/admin/classifieds/index.tsx)
- [apps/web/pages/admin/classifieds/new.tsx](../apps/web/pages/admin/classifieds/new.tsx)
- [apps/web/pages/admin/classifieds/[id].tsx](../apps/web/pages/admin/classifieds/[id].tsx)
- [apps/web/pages/api/public/classifieds/index.ts](../apps/web/pages/api/public/classifieds/index.ts)
- [apps/web/pages/api/public/classifieds/[slug].ts](../apps/web/pages/api/public/classifieds/[slug].ts)
- [apps/web/pages/api/public/classifieds/submit.ts](../apps/web/pages/api/public/classifieds/submit.ts)
- [apps/web/pages/api/admin/classifieds/index.ts](../apps/web/pages/api/admin/classifieds/index.ts)
- [apps/web/pages/api/admin/classifieds/[id].ts](../apps/web/pages/api/admin/classifieds/[id].ts)
- [apps/web/components/admin/ClassifiedEditor.tsx](../apps/web/components/admin/ClassifiedEditor.tsx)

### Data/bootstrap

- [apps/web/prisma/schema.prisma](../apps/web/prisma/schema.prisma)
- [apps/web/prisma/migrations/20260421000000_init/migration.sql](../apps/web/prisma/migrations/20260421000000_init/migration.sql)
- [apps/web/prisma/seed.ts](../apps/web/prisma/seed.ts)
- [docker-compose.yml](../docker-compose.yml)

## Important Implementation Choice

The repo now uses one PostgreSQL Prisma schema across local, preview, and production.

- schema: [apps/web/prisma/schema.prisma](../apps/web/prisma/schema.prisma)
- local database: [docker-compose.yml](../docker-compose.yml)
- migrations: [apps/web/prisma/migrations](../apps/web/prisma/migrations)
- local setup: `npm run db:start` then `npm run db:setup`
- deploy migrations: `npm run db:migrate:deploy`
- build for hosting: `npm run build`

Use `apps/web/.env.production.example` as the production environment template. Only run `npm run db:seed:production` against staging/demo databases unless London News explicitly wants demo content and accounts in the hosted environment.

For a production-like rehearsal, follow [docs/STAGING-CHECKLIST.md](./STAGING-CHECKLIST.md), [docs/VERCEL-ENV-MATRIX.md](./VERCEL-ENV-MATRIX.md), and [docs/VERCEL-GO-LIVE-RUNBOOK.md](./VERCEL-GO-LIVE-RUNBOOK.md).

## What’s Finished

- Public homepage renders from seeded CMS-like data
- Article, category, and topic pages build statically and revalidate
- Classifieds index, detail pages, and submit form are live
- Login and registration pages work with seeded accounts
- Admin dashboard and article desk are in place
- Category admin is in place with taxonomy, nav, and SEO controls
- Classifieds submission, moderation, and publishing workflow is in place
- Homepage editor supports slotting, drafts, preview, publish, and scheduling
- London mood widget supports live daily voting with persisted results and duplicate-vote blocking by browser token
- Article bodies are stored as structured blocks with a richer editor and revision logging
- Public API endpoints exist for homepage, article, category, classifieds, and search payloads
- Newsletter signups, public contact messages, and moderated classified enquiries persist to the database and are visible to editorial staff
- PostgreSQL migration history is in place and the repo is wired for `DIRECT_URL`
- Production baseline guards are in place for same-origin mutation checks, guest registration gating, Redis-backed rate limiting, Vercel cron secret enforcement, readiness probes, and security headers
- Vercel Blob uploads are wired into article hero images, homepage SEO images, and classifieds images
- Public API endpoints emit CDN cache headers and public fallbacks were removed from hosted runtime paths

## What The Next Developer Should Probably Do First

1. Provision the production PostgreSQL database and set hosting secrets.
2. Run `npm run db:migrate:deploy` during deployment or release setup.
3. Run the staging dry-run checklist against the hosting target.
4. Expand the Playwright suite from smoke coverage into full publish/schedule workflow coverage.
5. Replace the remaining homepage JSON editing surfaces with first-class admin controls.
6. Confirm `CRON_SECRET` is configured and reaches `/api/jobs/publish-homepage-due` as `Authorization: Bearer <CRON_SECRET>`.
7. Decide the production rollout for notifications, subscriptions, and classifieds monetization.

## Target Taxonomy

Use this as the desired section/topic structure for the next content-model and navigation pass:

- `Politics`: `City Hall`, `Westminster`, `Elections`
- `Business`: `Markets`, `Property`, `Work & Careers`, `Tech`
- `Culture`: `Theatre`, `Music`, `Film`, `Design`
- `Classifieds`: dedicated marketplace section

## Notes On Scope

The homepage workflow remains more mature than the rest of the CMS. That is intentional. The provided reference bundles were strongest around homepage/admin flows, so this repo prioritizes publication control, taxonomy, classifieds, search, and audience capture while leaving deeper enterprise workflow maturity for the next phase.
