# Vercel Go-Live Runbook

This runbook assumes the current London News monorepo, with the production app in [apps/web](/Users/sam/Documents/LondonNews/apps/web), and the release workflow in [.github/workflows/release-migrations.yml](/Users/sam/Documents/LondonNews/.github/workflows/release-migrations.yml).

## 1. Provisioning

1. Create one Vercel project for London News.
2. Set the project Root Directory to `apps/web`.
3. Provision two isolated service sets:
   - `Preview`: Postgres, Blob, Redis
   - `Production`: Postgres, Blob, Redis
4. Create a protected preview hostname, for example `preview.londonnews.example.com`.
5. Reserve the public production hostname, for example `www.londonnews.example.com`.

## 2. Environment Loading

1. Populate Vercel project variables using [docs/VERCEL-ENV-MATRIX.md](/Users/sam/Documents/LondonNews/docs/VERCEL-ENV-MATRIX.md).
2. Set `NEXTAUTH_URL` and `NEXT_PUBLIC_SITE_URL` for preview to the protected preview hostname, not to a one-off branch URL.
3. Set `NEXTAUTH_URL` and `NEXT_PUBLIC_SITE_URL` for production to the final public hostname.
4. Set `CRON_SECRET` in both preview and production.
5. Set the optional `NEXT_PUBLIC_*` publisher profile variables if the public contact and legal pages should show real production contact details.
6. Keep `ALLOW_GUEST_REGISTRATION=false` in both hosted environments.
7. Add the production values to GitHub repository secrets for [.github/workflows/release-migrations.yml](/Users/sam/Documents/LondonNews/.github/workflows/release-migrations.yml).

## 3. Vercel Project Configuration

1. Confirm Node.js version is `22.x`.
2. Confirm the cron schedule from [apps/web/vercel.json](/Users/sam/Documents/LondonNews/apps/web/vercel.json) is present after deploy.
3. Enable Deployment Protection on preview so admin and preview content are not broadly exposed.
4. Connect the production branch that will own public releases.

## 4. Preview Dry Run

1. Push the release candidate to a non-production branch.
2. Wait for the Vercel preview deployment to complete.
3. Run the staging acceptance checklist in [docs/STAGING-CHECKLIST.md](/Users/sam/Documents/LondonNews/docs/STAGING-CHECKLIST.md).
4. Validate these routes specifically:
   - `/`
   - `/login`
   - `/admin`
   - `/admin/homepage`
   - `/classifieds`
   - `/classifieds/submit`
   - `/sections`
   - `/api/healthz`
   - `/api/readyz`
5. Confirm `/api/readyz` returns `200` with no missing env values.
6. Confirm media uploads work from the admin UI.
7. Confirm article publish, homepage publish, homepage schedule, category edits, and classifieds moderation all update the public site.
8. Confirm the scheduled homepage route works with `Authorization: Bearer <CRON_SECRET>`.

## 5. Production Release Gate

Do not release until all of these are true:

- Preview smoke test passed
- `/api/readyz` is green in preview
- Admin login works on preview
- Blob uploads work on preview
- Public APIs return cache headers
- Redis-backed rate limiting is active
- Preview remains protected and unindexed
- GitHub Actions release workflow is green on the release commit

## 6. Production Release

1. Merge the approved release commit to the production branch.
2. Let [.github/workflows/release-migrations.yml](/Users/sam/Documents/LondonNews/.github/workflows/release-migrations.yml) run `npm run db:migrate:deploy`, typecheck, and build against production secrets.
3. After the workflow passes, allow the Vercel production deployment to complete.
4. Verify the live deployment immediately:
   - `/api/healthz`
   - `/api/readyz`
   - homepage
   - one published article
   - one category page
   - one topic page
   - classifieds index
   - admin login
5. Open the homepage desk and confirm scheduled publishing still works.
6. Check Vercel runtime logs for auth, upload, cron, and DB errors.

## 7. Post-Launch Checks

Within the first hour after cutover:

- Verify canonical tags and Open Graph image output on a live article
- Verify `robots.txt` and `sitemap.xml`
- Verify rate limiting on login and classifieds submission
- Verify public pages stay functional if one external feed is slow
- Verify homepage editorial slots reflect the current active homepage record

## 8. Rollback

If the production deploy is bad:

1. Roll back the Vercel deployment first.
2. Keep the database in place unless there is a confirmed migration failure that requires a DB recovery plan.
3. If the issue is content-only, stop publishing changes from the admin while investigating.
4. If the issue is migration-related, pause further deploys and inspect the production database before attempting manual fixes.

## 9. Non-Negotiable Constraints

- Do not share the production database with preview deployments.
- Do not run production migrations from a developer laptop.
- Do not enable guest registration in production unless London News explicitly changes that product decision.
- Do not treat branch preview URLs as the canonical preview hostname for auth and SEO.
