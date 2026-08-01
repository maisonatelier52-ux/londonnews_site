import type { NextApiRequest, NextApiResponse } from "next";
import { getSectionPath } from "../taxonomy";
import { getLegacyCollectionPath, getPreferredArticlePath } from "../legacy-routes";
import { logEvent } from "./logger";

function uniquePaths(paths: Array<string | null | undefined>) {
  return [...new Set(paths.filter((path): path is string => Boolean(path)))];
}

function readHeader(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] || "";
  }

  return value || "";
}

function resolveSiteOrigin(req?: Pick<NextApiRequest, "headers"> | null) {
  const host = req
    ? readHeader(req.headers["x-forwarded-host"]) || readHeader(req.headers.host)
    : "";
  const proto = req
    ? readHeader(req.headers["x-forwarded-proto"]) ||
      (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https")
    : "";

  if (host) {
    return `${proto || "https"}://${host}`;
  }

  for (const key of ["NEXT_PUBLIC_SITE_URL", "NEXTAUTH_URL"]) {
    const value = process.env[key];
    if (!value) continue;

    try {
      return new URL(value).origin;
    } catch {
      continue;
    }
  }

  return null;
}

async function warmRevalidatedPaths(
  paths: string[],
  options: {
    req?: Pick<NextApiRequest, "headers"> | null;
    siteOrigin?: string | null;
    context?: Record<string, unknown>;
  } = {}
) {
  const siteOrigin = options.siteOrigin ?? resolveSiteOrigin(options.req);
  if (!siteOrigin || paths.length === 0) {
    return {
      warmed: [] as string[],
      warmFailures: paths
    };
  }

  const warmed: string[] = [];
  const warmFailures: string[] = [];

  for (const path of paths) {
    try {
      const response = await fetch(new URL(path, siteOrigin), {
        method: "GET",
        headers: {
          "Cache-Control": "no-cache",
          "User-Agent": "LondonNews-Revalidator/1.0"
        }
      });

      if (!response.ok && response.status !== 404) {
        throw new Error(`Warmup returned ${response.status}`);
      }

      warmed.push(path);
    } catch (error) {
      warmFailures.push(path);
      logEvent("warn", "revalidate.warm_failed", {
        path,
        siteOrigin,
        error,
        ...options.context
      });
    }
  }

  return { warmed, warmFailures };
}

type RevalidateOptions = {
  context?: Record<string, unknown>;
  criticalPaths?: Array<string | null | undefined>;
  warmPaths?: Array<string | null | undefined>;
  req?: Pick<NextApiRequest, "headers"> | null;
  siteOrigin?: string | null;
};

export async function revalidatePaths(
  res: NextApiResponse,
  paths: Array<string | null | undefined>,
  options: RevalidateOptions = {}
) {
  const targets = uniquePaths(paths);
  const criticalTargets = new Set(uniquePaths(options.criticalPaths || []));
  const warmTargets = new Set(uniquePaths(options.warmPaths || []));
  const failures: string[] = [];
  const revalidated: string[] = [];

  for (const path of targets) {
    try {
      await res.revalidate(path, { unstable_onlyGenerated: false });
      revalidated.push(path);
    } catch (error) {
      failures.push(path);
      logEvent(criticalTargets.has(path) ? "error" : "warn", "revalidate.failed", {
        path,
        critical: criticalTargets.has(path),
        error,
        ...options.context
      });
    }
  }

  const warmablePaths = revalidated.filter((path) => warmTargets.has(path));
  const { warmed, warmFailures } = await warmRevalidatedPaths(warmablePaths, {
    req: options.req,
    siteOrigin: options.siteOrigin,
    context: options.context
  });
  const criticalFailures = failures.filter((path) => criticalTargets.has(path));

  if (targets.length > 0) {
    logEvent(
      criticalFailures.length > 0 || warmFailures.length > 0 ? "warn" : "info",
      "revalidate.completed",
      {
        ...options.context,
        targets,
        revalidated,
        failures,
        criticalFailures,
        warmed,
        warmFailures,
        siteOrigin: options.siteOrigin ?? resolveSiteOrigin(options.req)
      }
    );
  }

  return {
    revalidated,
    failures,
    criticalFailures,
    warmed,
    warmFailures
  };
}

export function articlePath(slug?: string | null) {
  return slug ? `/articles/${slug}` : null;
}

function articlePublicPaths(article: {
  seo?: { slug?: string | null } | null;
  section?: {
    slug?: string | null;
    parentId?: string | null;
    parent?: { slug?: string | null } | null;
  } | null;
} | null | undefined) {
  const slug = article?.seo?.slug;
  if (!slug) {
    return [];
  }

  return uniquePaths([
    articlePath(slug),
    getPreferredArticlePath({
      slug,
      section: article?.section || null
    })
  ]);
}

export function articleCriticalRevalidateTargets(
  articles: Array<{
    seo?: { slug?: string | null } | null;
    section?: {
      slug?: string | null;
      parentId?: string | null;
      parent?: { slug?: string | null } | null;
    } | null;
  } | null | undefined>
) {
  return uniquePaths(articles.flatMap((article) => articlePublicPaths(article)));
}

export function articleMutationRevalidateTargets(
  previousArticle: {
    seo?: { slug?: string | null } | null;
    section?: {
      slug?: string | null;
      parentId?: string | null;
      parent?: { slug?: string | null } | null;
    } | null;
  } | null | undefined,
  nextArticle: {
    seo?: { slug?: string | null } | null;
    section?: {
      slug?: string | null;
      parentId?: string | null;
      parent?: { slug?: string | null } | null;
    } | null;
  } | null | undefined
) {
  return uniquePaths([
    ...articleRevalidateTargets(previousArticle || null),
    ...articleRevalidateTargets(nextArticle || null)
  ]);
}

export function articleWarmTargets(articles: Array<{ seo?: { slug?: string | null } | null } | null | undefined>) {
  return articleCriticalRevalidateTargets(articles);
}

export function articleRevalidateTargets(article: {
  seo?: { slug?: string | null } | null;
  section?: {
    slug?: string | null;
    parentId?: string | null;
    parent?: {
      slug?: string | null;
    } | null;
  } | null;
} | null) {
  const emptyPaths: string[] = [];
  if (!article) {
    return emptyPaths;
  }

  const sectionPath = article.section ? getSectionPath(article.section) : null;
  const legacySectionPath = article.section ? getLegacyCollectionPath(article.section) : null;
  const parentPath =
    article.section?.parent?.slug ? `/category/${article.section.parent.slug}` : null;

  return uniquePaths([
    "/",
    "/sections",
    "/sitemap.xml",
    "/news-sitemap.xml",
    ...articlePublicPaths(article),
    sectionPath,
    legacySectionPath,
    parentPath
  ]);
}

export function homepageRevalidateTargets() {
  return ["/", "/sections", "/classifieds", "/sitemap.xml", "/news-sitemap.xml"];
}

export function categoryRevalidateTargets(section: {
  slug?: string | null;
  parent?: { slug?: string | null } | null;
  parentId?: string | null;
}) {
  const path = getSectionPath(section);
  const legacyPath = getLegacyCollectionPath(section);
  const parentPath = section.parent?.slug ? `/category/${section.parent.slug}` : null;

  return uniquePaths(["/", "/sections", "/sitemap.xml", "/news-sitemap.xml", path, legacyPath, parentPath]);
}

export function classifiedRevalidateTargets(slug?: string | null) {
  return uniquePaths([
    "/",
    "/classifieds",
    "/sitemap.xml",
    "/news-sitemap.xml",
    slug ? `/classifieds/${slug}` : null
  ]);
}
