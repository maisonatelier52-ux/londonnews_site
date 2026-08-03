# Staging Dry-Run Checklist

Use this checklist before handing London News to a hosting developer or pointing real traffic at the app.

## 1. Environment

- Provision a PostgreSQL database for staging.
- Copy values from [apps/web/.env.production.example](../apps/web/.env.production.example) into the hosting provider's environment manager.
- Set `DATABASE_URL` to the staging PostgreSQL connection string.
- Set `DIRECT_URL` to the direct/non-pooled staging PostgreSQL connection string.
- Set `NEXTAUTH_URL` and `NEXT_PUBLIC_SITE_URL` to the staging URL.
- Generate long random values for `NEXTAUTH_SECRET` and `CRON_SECRET`.
- Set `BLOB_READ_WRITE_TOKEN`, `UPSTASH_REDIS_REST_URL`, and `UPSTASH_REDIS_REST_TOKEN`.
- Keep `ALLOW_GUEST_REGISTRATION="false"` unless staging specifically needs public guest-writer signup testing.

## 2. Release Commands

Run from the monorepo root:

```bash
npm install
npm run db:migrate:deploy
npm run build
```

Optional for staging/demo only:

```bash
npm run db:seed:production
```

Do not run the seed command against the final production database unless London News intentionally wants demo accounts and sample content there.

## 3. Smoke Test

- Open the public homepage and confirm top navigation, homepage sections, article links, topic links, and classifieds links load.
- Sign in at `/login` with a known staging account.
- Confirm `/register` is disabled when `ALLOW_GUEST_REGISTRATION` is false.
- Confirm `/api/readyz` returns `200`.
- Create an article draft, save it, submit it for review, and publish it.
- Create or edit a category and confirm parent/child taxonomy appears on public category/topic pages.
- Create a homepage draft, preview it, publish it, and schedule a future publish time.
- Trigger the scheduled-publish endpoint with `Authorization: Bearer <CRON_SECRET>`.
- Upload an article hero image, homepage SEO image, and classifieds image through the admin Blob upload flow.
- Submit a classified listing from `/classifieds/submit`, then approve, feature, reject, and expire test listings from `/admin/classifieds`.
- Vote in the homepage mood survey, confirm totals update, then confirm a second vote from the same browser is blocked for the day.
- Check `/sitemap.xml` and `/robots.txt`.
- Spot-check article SEO metadata: title, description, canonical URL, Open Graph image, article JSON-LD, and breadcrumbs.
- Confirm unauthenticated users are redirected away from `/admin` routes.
- Confirm login, registration, and classifieds submission return rate-limit headers and eventually return `429` after repeated attempts.
- Confirm `/api/public/homepage` and `/api/public/categories?mode=tree` return `Cache-Control` headers with `s-maxage`.

## 4. Security Checks

- Confirm `CRON_SECRET` is set in production-like environments.
- Confirm guest registration remains closed unless there is an explicit product decision to allow it.
- Confirm security headers are present: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, and `Permissions-Policy`.
- Confirm same-origin mutation checks block cross-site POST/PUT/DELETE requests.
- Confirm Redis-backed rate limiting is configured in staging.

## 5. Rollback Notes

- Keep the previous deployment available until migrations and smoke tests pass.
- If a migration fails, stop the release before shifting traffic.
- If content workflows fail after deploy, roll back the app build first and inspect the database state before applying manual data fixes.
