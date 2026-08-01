# Developer Handoff Note

This archive is the working London News monorepo from this workspace. The main app lives in `apps/web`.

Important context:

- This repo is the source for the current Pages Router newsroom/CMS implementation in this workspace.
- The deployed design at `https://london-news-two.vercel.app/` does not appear to come from this repo. Treat that deployment as visual reference only unless its actual source code is provided separately.
- Local-only files are intentionally excluded from the handoff zip: `node_modules`, `.next`, and `apps/web/.env`.

## First Steps

1. Run `npm install`.
2. Copy `apps/web/.env.example` to `apps/web/.env` for local work.
3. Start local Postgres with `npm run db:start`.
4. Seed local data with `npm run db:setup`.
5. For production/staging, use PostgreSQL with `apps/web/prisma/schema.prisma` and `npm run db:migrate:deploy`.

## What Still Needs To Be Implemented

- Confirm whether the team is continuing this repo or a different Vercel/App Router codebase. Do not assume the inspected deployment maps to this source tree.
- Expand the Playwright suite from smoke coverage into full publish/schedule workflow coverage.
- On Vercel, configure `CRON_SECRET` so cron calls arrive as `Authorization: Bearer <CRON_SECRET>` at `/api/jobs/publish-homepage-due`.
- Add article preview URLs, scheduled publish/unpublish, and correction-note workflow.
- Add deeper monitoring and operational error reporting beyond the baseline structured logs and readiness probes.
- Decide whether to add premium memberships, paid classifieds packages, and seller verification in the next phase.
- Finalize production auth, role boundaries, and invite/self-registration policy.

## Target Editorial Taxonomy

The next pass should treat this as the working information architecture target:

- `Politics`
- `Politics > City Hall`
- `Politics > Westminster`
- `Politics > Elections`
- `Business`
- `Business > Markets`
- `Business > Property`
- `Business > Work & Careers`
- `Business > Tech`
- `Culture`
- `Culture > Theatre`
- `Culture > Music`
- `Culture > Film`
- `Culture > Design`
- `Classifieds`

Implementation expectation:

- top-level sections should be first-class navigation items where appropriate
- sub-sections should resolve cleanly to topic or child-category pages
- homepage modules should be able to slot stories from these desks
- classifieds should remain a dedicated public section with its own submission and moderation workflow

## Notes On Current State

- The homepage workflow, category/topic taxonomy, classifieds workflow, and mood survey are implemented as a functional newsroom baseline.
- The mood widget now supports persisted daily voting with duplicate-vote blocking by browser token.
- The repo now includes structured article blocks with revision logging, database-backed site-wide search, persisted newsletter signups, public contact capture, and moderated classifieds enquiries.
- The repo is now Postgres-only, includes Vercel Blob upload wiring, Redis-capable rate limiting, readiness probes, audience admin surfaces, and Vercel cron config.
- The repo is not initialized as git in this workspace. If versioned delivery is required, initialize git before collaborative development starts.
