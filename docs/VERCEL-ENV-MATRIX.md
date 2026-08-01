# Vercel Environment Matrix

This matrix is derived from the current London News runtime in [apps/web](/Users/sam/Documents/LondonNews/apps/web), the readiness contract in [apps/web/pages/api/readyz.ts](/Users/sam/Documents/LondonNews/apps/web/pages/api/readyz.ts), and the environment helpers in [apps/web/lib/security/env.ts](/Users/sam/Documents/LondonNews/apps/web/lib/security/env.ts).

## Vercel Project Settings

- Framework preset: `Next.js`
- Root Directory: `apps/web`
- Install Command: `npm install`
- Build Command: `npm run build`
- Output Directory: default Next.js output
- Node.js version: `22.x`
- Production branch: `main` or `master`, whichever the team uses for releases

## Vercel Project Environment Variables

Use separate values for `Preview` and `Production`. Do not point preview deployments at the production write database.

| Variable | Preview | Production | Required | Notes |
| --- | --- | --- | --- | --- |
| `DATABASE_URL` | preview pooled runtime URL | production pooled runtime URL | yes | Runtime Prisma connection string. |
| `DIRECT_DATABASE_URL` | preview direct URL | production direct URL | yes | Used for `prisma migrate deploy`. |
| `NEXTAUTH_URL` | stable protected preview URL | canonical public URL | yes | Recommended preview value: a dedicated preview alias such as `https://preview.londonnews.example.com`. |
| `NEXT_PUBLIC_SITE_URL` | same as preview site URL | same as public site URL | yes | Used for canonicals, structured data, and public links. |
| `NEXTAUTH_SECRET` | unique preview secret | unique production secret | yes | Generate long random secrets separately per environment. |
| `CRON_SECRET` | preview cron secret | production cron secret | yes | Vercel Cron sends `Authorization: Bearer <CRON_SECRET>`. |
| `BLOB_READ_WRITE_TOKEN` | preview Blob token | production Blob token | yes | Required for admin media uploads. |
| `UPSTASH_REDIS_REST_URL` | preview Redis REST URL | production Redis REST URL | yes | Shared rate limiting backend. |
| `UPSTASH_REDIS_REST_TOKEN` | preview Redis token | production Redis token | yes | Shared rate limiting backend. |
| `ALLOW_GUEST_REGISTRATION` | `false` | `false` | yes | Keep closed unless product explicitly reopens public signup. |

## Optional Public Publisher Profile Variables

These power the public contact route and publisher information surfaces. Set them in both Preview and Production if London News wants real contact details rendered on-site.

| Variable | Preview | Production | Required | Notes |
| --- | --- | --- | --- | --- |
| `NEXT_PUBLIC_PUBLISHER_NAME` | preview publisher name | production publisher name | no | Shown on public contact and publisher information surfaces. |
| `NEXT_PUBLIC_EDITORIAL_EMAIL` | preview editorial inbox | production editorial inbox | no | Reader and editorial contact destination displayed publicly. |
| `NEXT_PUBLIC_MEMBERSHIPS_EMAIL` | preview memberships inbox | production memberships inbox | no | Used on subscribe and membership-oriented public surfaces. |
| `NEXT_PUBLIC_CLASSIFIEDS_EMAIL` | preview classifieds inbox | production classifieds inbox | no | Displayed alongside classifieds support messaging. |
| `NEXT_PUBLIC_PUBLISHER_PHONE` | preview phone | production phone | no | Public phone number for publisher contact. |
| `NEXT_PUBLIC_PUBLISHER_ADDRESS` | preview address | production address | no | Public mailing or office address. |

## Optional Compatibility Variable

| Variable | Preview | Production | Required | Notes |
| --- | --- | --- | --- | --- |
| `CRON_TOKEN` | optional | optional | no | Compatibility alias for manual callers outside Vercel. If set, keep it equal to `CRON_SECRET`. |

## Vercel System Variables

These are provided by Vercel automatically. Do not create them manually:

- `VERCEL`
- `VERCEL_ENV`
- `VERCEL_URL`

## GitHub Actions Repository Secrets

These are used by [.github/workflows/release-migrations.yml](/Users/sam/Documents/LondonNews/.github/workflows/release-migrations.yml).

| Secret | Value |
| --- | --- |
| `DATABASE_URL` | production pooled runtime URL |
| `DIRECT_DATABASE_URL` | production direct migration URL |
| `NEXTAUTH_URL` | canonical public URL |
| `NEXT_PUBLIC_SITE_URL` | canonical public URL |
| `NEXTAUTH_SECRET` | production auth secret |
| `CRON_SECRET` | production cron secret |
| `BLOB_READ_WRITE_TOKEN` | production Blob token |
| `UPSTASH_REDIS_REST_URL` | production Redis REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | production Redis REST token |

## Environment Ownership

- `Preview`: isolated non-production Postgres, Blob, and Redis
- `Production`: isolated production Postgres, Blob, and Redis
- `GitHub Actions`: production secrets only, used for release-safe migrations and build verification

## Source Files

- [apps/web/.env.example](/Users/sam/Documents/LondonNews/apps/web/.env.example)
- [apps/web/.env.production.example](/Users/sam/Documents/LondonNews/apps/web/.env.production.example)
- [apps/web/pages/api/jobs/publish-homepage-due.ts](/Users/sam/Documents/LondonNews/apps/web/pages/api/jobs/publish-homepage-due.ts)
- [apps/web/pages/api/readyz.ts](/Users/sam/Documents/LondonNews/apps/web/pages/api/readyz.ts)
