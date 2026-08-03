function safeOrigin(value?: string | null) {
  if (!value) return null;

  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

export function isGuestRegistrationEnabled() {
  return process.env.ALLOW_GUEST_REGISTRATION === "true";
}

export function isHostedRuntime() {
  return Boolean(process.env.VERCEL) || Boolean(process.env.VERCEL_ENV);
}

export function isPreviewRuntime() {
  return process.env.VERCEL_ENV === "preview";
}

export function isProductionRuntime() {
  return process.env.VERCEL_ENV === "production";
}

export function shouldUseSecureCookies() {
  return Boolean(process.env.VERCEL_ENV) || safeOrigin(process.env.NEXTAUTH_URL)?.startsWith("https://") || safeOrigin(process.env.NEXT_PUBLIC_SITE_URL)?.startsWith("https://");
}

export function getCronAuthSecret() {
  return process.env.CRON_SECRET || process.env.CRON_TOKEN || "";
}

export function getRedisRestUrl() {
  return process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || "";
}

export function getRedisRestToken() {
  return process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || "";
}

export function getRequiredRuntimeEnv() {
  return [
    "DATABASE_URL",
    "DIRECT_URL",
    "NEXTAUTH_URL",
    "NEXT_PUBLIC_SITE_URL",
    "NEXTAUTH_SECRET"
  ];
}

export function getMissingRuntimeEnv() {
  const missing = getRequiredRuntimeEnv().filter((key) => !process.env[key]);
  if (!getCronAuthSecret()) {
    missing.push("CRON_SECRET");
  }
  return missing;
}

export function getMissingHostedEnv() {
  const missing: string[] = [];

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    missing.push("BLOB_READ_WRITE_TOKEN");
  }

  if (!getRedisRestUrl()) {
    missing.push("UPSTASH_REDIS_REST_URL|KV_REST_API_URL");
  }

  if (!getRedisRestToken()) {
    missing.push("UPSTASH_REDIS_REST_TOKEN|KV_REST_API_TOKEN");
  }

  return missing;
}
