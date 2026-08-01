# Deployment Checklist

## Before Deployment

- Set the Vercel project root directory to `apps/web`
- Set real values for `NEXTAUTH_SECRET`
- Set the real `NEXTAUTH_URL`
- Set the real `NEXT_PUBLIC_SITE_URL`
- Set the real `CRON_SECRET`
- Set `DIRECT_DATABASE_URL` for migration-time access
- Set `BLOB_READ_WRITE_TOKEN`
- Set `UPSTASH_REDIS_REST_URL`
- Set `UPSTASH_REDIS_REST_TOKEN`
- Set `ALLOW_GUEST_REGISTRATION` to `false` unless public guest-writer signup is intentional
- Provision a PostgreSQL production database
- Set `DATABASE_URL` to the production PostgreSQL runtime connection string

## Database Plan

Local development:

- PostgreSQL container defined in [docker-compose.yml](../docker-compose.yml)
- schema defined in [apps/web/prisma/schema.prisma](../apps/web/prisma/schema.prisma)
- local setup path: `npm run db:start` then `npm run db:setup`

Production setup:

1. Copy values from [apps/web/.env.production.example](../apps/web/.env.production.example) into the hosting provider's environment variables.
2. Apply the exact scoping in [VERCEL-ENV-MATRIX.md](./VERCEL-ENV-MATRIX.md).
3. Run `npm run db:migrate:deploy` from the monorepo root to apply [apps/web/prisma/migrations](../apps/web/prisma/migrations).
4. Build with `npm run build`.
5. Run `npm run db:seed:production` only for staging/demo environments where seeded accounts and sample content are acceptable.

Recommended hosting commands:

- Install command: `npm install`
- Migration command: `npm run db:migrate:deploy`
- Build command: `npm run build`
- Start command: `npm run start`

If the host supports a separate deploy hook or release command, run `npm run db:migrate:deploy` there before traffic is shifted to the new build.

Before handoff or launch, run the [staging dry-run checklist](./STAGING-CHECKLIST.md) and then the [VERCEL-GO-LIVE-RUNBOOK.md](./VERCEL-GO-LIVE-RUNBOOK.md).

## Auth Plan

- Keep credentials auth only if newsroom users are managed internally.
- If needed, replace with enterprise auth or invite-only access.
- Review cookie settings and callback URLs for the deployment host.
- Guest-writer self-registration is gated by `ALLOW_GUEST_REGISTRATION` and should stay disabled for production unless London News explicitly wants public signup.

## Security Baseline

- Production cron publishing fails closed if `CRON_SECRET` or the compatibility alias `CRON_TOKEN` is missing.
- Login, registration, mood voting, classifieds submission, media upload, and admin mutations are rate-limited through the shared Redis-backed limiter when Redis env vars are present.
- Cookie-authenticated POST/PUT/DELETE routes enforce same-origin checks.
- Security headers are configured in [apps/web/next.config.js](../apps/web/next.config.js).
- Public read APIs emit CDN cache headers and admin/mutation APIs are explicitly uncacheable.
- Readiness probes are exposed at `/api/healthz` and `/api/readyz`.

## Scheduling

Homepage scheduling already exists in code:

- publish endpoint: [apps/web/pages/api/admin/homepages/[id]/publish.ts](../apps/web/pages/api/admin/homepages/[id]/publish.ts)
- schedule endpoint: [apps/web/pages/api/admin/homepages/[id]/schedule.ts](../apps/web/pages/api/admin/homepages/[id]/schedule.ts)
- cron endpoint: [apps/web/pages/api/jobs/publish-homepage-due.ts](../apps/web/pages/api/jobs/publish-homepage-due.ts)

Production scheduler is now defined in [apps/web/vercel.json](../apps/web/vercel.json). On Vercel, set `CRON_SECRET`; the runtime also accepts `CRON_TOKEN` as a compatibility alias for manual callers outside Vercel.

## Media And Content

Implemented in this pass:

- authenticated image upload endpoint at `/api/admin/media/upload`
- Blob-backed upload-first UX for article hero images, homepage SEO images, and classifieds images

Still recommended:

- richer body-editor content sanitization strategy
- editorial audit history if required

## QA Before Launch

- Browser test login, registration, article draft save, article publish
- Browser test homepage draft save, preview open, publish, schedule
- Browser test `/api/readyz` returns `200`
- Validate public API cache headers on homepage and taxonomy endpoints
- Validate public article/category links from homepage slots
- Validate SEO tags in generated pages
- Confirm preview URLs stay secret and unindexed

## Packaging For The Developer

- Initialize git if this will be handed off as a repository
- Exclude `.next`, `node_modules`, and local-only artifacts
- Share this repo together with the docs in `/docs`
