import type { NextApiRequest, NextApiResponse } from "next";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { getRedisRestToken, getRedisRestUrl } from "./env";

export { isGuestRegistrationEnabled } from "./env";

type RateLimitRecord = {
  count: number;
  resetAt: number;
};

export type RateLimitConfig = {
  keyPrefix: string;
  max: number;
  windowMs: number;
  customKey?: string | null;
};

type RateLimitResult = {
  limited: boolean;
  remaining: number;
  resetAt: number;
  retryAfter: number;
};

const buckets = new Map<string, RateLimitRecord>();
const limiterCache = new Map<string, Ratelimit>();

let redisClient: Redis | null | undefined;

function getRedisClient() {
  if (redisClient !== undefined) {
    return redisClient;
  }

  const url = getRedisRestUrl();
  const token = getRedisRestToken();

  if (!url || !token) {
    redisClient = null;
    return redisClient;
  }

  redisClient = new Redis({
    url,
    token
  });

  return redisClient;
}

function getRedisLimiter(config: RateLimitConfig) {
  const cacheKey = `${config.keyPrefix}:${config.max}:${config.windowMs}`;
  const existing = limiterCache.get(cacheKey);
  if (existing) {
    return existing;
  }

  const redis = getRedisClient();
  if (!redis) {
    return null;
  }

  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(config.max, `${Math.max(Math.ceil(config.windowMs / 1000), 1)} s`),
    prefix: `londonnews:${config.keyPrefix}`
  });
  limiterCache.set(cacheKey, limiter);
  return limiter;
}

export function getClientIp(req: NextApiRequest) {
  const forwardedFor = req.headers["x-forwarded-for"];
  if (Array.isArray(forwardedFor)) {
    return forwardedFor[0]?.split(",")[0]?.trim() || "unknown";
  }

  return (
    forwardedFor?.split(",")[0]?.trim() ||
    String(req.headers["x-real-ip"] || "") ||
    req.socket.remoteAddress ||
    "unknown"
  );
}

function runMemoryRateLimit(req: NextApiRequest, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const key = `${config.keyPrefix}:${config.customKey || getClientIp(req)}`;
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + config.windowMs;
    buckets.set(key, { count: 1, resetAt });
    return {
      limited: false,
      remaining: Math.max(config.max - 1, 0),
      resetAt,
      retryAfter: 0
    };
  }

  existing.count += 1;
  buckets.set(key, existing);

  return {
    limited: existing.count > config.max,
    remaining: Math.max(config.max - existing.count, 0),
    resetAt: existing.resetAt,
    retryAfter: Math.max(Math.ceil((existing.resetAt - now) / 1000), 1)
  };
}

export async function checkRateLimit(
  req: NextApiRequest,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const limiter = getRedisLimiter(config);
  if (!limiter) {
    return runMemoryRateLimit(req, config);
  }

  const identifier = config.customKey || getClientIp(req);
  const result = await limiter.limit(identifier);

  return {
    limited: !result.success,
    remaining: result.remaining,
    resetAt: result.reset,
    retryAfter: Math.max(Math.ceil((result.reset - Date.now()) / 1000), 1)
  };
}

export function sendRateLimitHeaders(
  res: NextApiResponse,
  result: RateLimitResult
) {
  res.setHeader("X-RateLimit-Remaining", String(result.remaining));
  res.setHeader("X-RateLimit-Reset", String(Math.ceil(result.resetAt / 1000)));

  if (result.limited) {
    res.setHeader("Retry-After", String(result.retryAfter));
  }
}
