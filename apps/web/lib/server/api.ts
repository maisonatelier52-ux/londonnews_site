import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/options";
import { checkRateLimit, sendRateLimitHeaders, type RateLimitConfig } from "../security/rate-limit";

type SessionUser = {
  id: string;
  role: string;
  name?: string | null;
  email?: string | null;
};

type HeaderWritable = {
  setHeader(name: string, value: string): void;
};

function readForwardedHeader(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] || "";
  }

  return value || "";
}

export function setNoStore(res: HeaderWritable) {
  res.setHeader("Cache-Control", "private, no-store, no-cache, max-age=0, must-revalidate");
}

export function setPublicApiCache(
  res: NextApiResponse,
  options: { sMaxAge: number; staleWhileRevalidate?: number }
) {
  const staleWhileRevalidate = options.staleWhileRevalidate ?? options.sMaxAge * 5;
  res.setHeader(
    "Cache-Control",
    `public, max-age=0, s-maxage=${options.sMaxAge}, stale-while-revalidate=${staleWhileRevalidate}`
  );
}

export function allowMethods(res: NextApiResponse, methods: string[]) {
  res.setHeader("Allow", methods.join(", "));
}

export function requireMethod(
  req: NextApiRequest,
  res: NextApiResponse,
  methods: string[]
) {
  if (!req.method || !methods.includes(req.method)) {
    allowMethods(res, methods);
    res.status(405).end();
    return false;
  }

  return true;
}

export function getAllowedOrigins(req: NextApiRequest) {
  const origins = new Set<string>();
  const host =
    readForwardedHeader(req.headers["x-forwarded-host"]) ||
    readForwardedHeader(req.headers.host);
  const proto =
    readForwardedHeader(req.headers["x-forwarded-proto"]) ||
    (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");

  if (host) {
    origins.add(`${proto}://${host}`);
  }

  for (const envKey of ["NEXTAUTH_URL", "NEXT_PUBLIC_SITE_URL"]) {
    const value = process.env[envKey];
    if (!value) continue;

    try {
      origins.add(new URL(value).origin);
    } catch {
      continue;
    }
  }

  return origins;
}

function getRequestOrigin(req: NextApiRequest) {
  const origin = readForwardedHeader(req.headers.origin);
  if (origin) {
    return origin;
  }

  const referer = readForwardedHeader(req.headers.referer);
  if (!referer) {
    return null;
  }

  try {
    return new URL(referer).origin;
  } catch {
    return null;
  }
}

export function requireSameOrigin(req: NextApiRequest, res: NextApiResponse) {
  const requestOrigin = getRequestOrigin(req);
  const allowedOrigins = getAllowedOrigins(req);

  if (!requestOrigin || !allowedOrigins.has(requestOrigin)) {
    res.status(403).json({ error: "Cross-origin mutation blocked." });
    return false;
  }

  return true;
}

export async function requireApiSession(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<SessionUser | null> {
  const session = await getServerSession(req, res, authOptions).catch(() => null);
  if (!session?.user?.id) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }

  return session.user;
}

export async function applyRouteRateLimit(
  req: NextApiRequest,
  res: NextApiResponse,
  config: RateLimitConfig,
  message: string
) {
  const result = await checkRateLimit(req, config);
  sendRateLimitHeaders(res, result);

  if (result.limited) {
    res.status(429).json({ error: message });
    return false;
  }

  return true;
}
