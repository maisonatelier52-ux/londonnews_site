import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { z } from "zod";
import { authOptions } from "../../auth/[...nextauth]";
import {
  canCreateArticles,
  canPublishArticles,
  getNextStatusForSubmission,
  isAuthorScopedRole
} from "../../../../utils/auth";
import { legacyContentToBlocks, normalizeBodyBlocks, bodyBlocksToLegacyContent, serializeBodyBlocks } from "../../../../lib/articles/blocks";
import { recordArticleRevision } from "../../../../lib/articles/revisions";
import { absoluteUrl } from "../../../../lib/cms/utils";
import { getPreferredArticlePath } from "../../../../lib/legacy-routes";
import { normalizeAbsoluteUrl } from "../../../../lib/seo";
import { applyRouteRateLimit, requireMethod, requireSameOrigin, setNoStore } from "../../../../lib/server/api";
import {
  articleCriticalRevalidateTargets,
  articleRevalidateTargets,
  articleWarmTargets,
  revalidatePaths
} from "../../../../lib/server/revalidate";
import { prisma } from "../../../../utils/prisma";
import { slugify, withNumericSuffix } from "../../../../utils/slug";

const articleSchema = z.object({
  title: z.string().min(3),
  sectionId: z.string().optional().nullable(),
  dek: z.string().optional().default(""),
  excerpt: z.string().optional().default(""),
  heroImage: z.string().optional().default(""),
  heroAlt: z.string().optional().default(""),
  content: z.string().optional().default(""),
  contentBlocks: z.array(z.unknown()).optional().default([]),
  seo: z.object({
    slug: z.string().optional().default(""),
    metaTitle: z.string().optional().default(""),
    metaDesc: z.string().optional().default(""),
    canonical: z.string().optional().default(""),
    socialTitle: z.string().optional().default(""),
    socialDescription: z.string().optional().default(""),
    socialImage: z.string().optional().default(""),
    noindex: z.boolean().optional().default(false)
  }),
  action: z.enum(["draft", "submit", "publish"]).default("draft")
});

async function uniqueSlug(input: string) {
  const base = slugify(input) || `story-${Date.now()}`;
  for (let attempt = 0; attempt < 25; attempt += 1) {
    const candidate = withNumericSuffix(base, attempt);
    const existing = await prisma.articleSEO.findUnique({ where: { slug: candidate } });
    if (!existing) return candidate;
  }
  return `${base}-${Date.now()}`;
}

async function validateEditorialSection(sectionId?: string | null) {
  if (!sectionId) {
    return { section: null };
  }

  const section = await prisma.section.findUnique({
    where: { id: sectionId },
    select: {
      id: true,
      slug: true,
      parentId: true,
      parent: {
        select: {
          slug: true
        }
      }
    }
  });

  if (!section) {
    return { error: "Selected section was not found." };
  }

  if (section.slug === "classifieds") {
    return { error: "Use the classifieds workflow for marketplace listings." };
  }

  return { section };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  setNoStore(res);
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user) return res.status(401).json({ error: "Unauthorized" });
  if (!canCreateArticles(session.user.role)) return res.status(403).json({ error: "Forbidden" });

  if (req.method === "GET") {
    const rows = await prisma.article.findMany({
      where: isAuthorScopedRole(session.user.role)
        ? { authorId: session.user.id }
        : undefined,
      include: {
        author: true,
        section: true,
        seo: true
      },
      orderBy: { updatedAt: "desc" },
      take: 50
    });

    return res.status(200).json(rows);
  }

  if (!requireMethod(req, res, ["GET", "POST"])) return;
  if (!requireSameOrigin(req, res)) return;
  const ok = await applyRouteRateLimit(
    req,
    res,
    {
      keyPrefix: "admin-articles",
      max: 30,
      windowMs: 10 * 60 * 1000
    },
    "Too many article changes from this connection. Please try again shortly."
  );
  if (!ok) return;

  const parsed = articleSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid article payload." });
  }

  const body = parsed.data;
  const contentBlocks = normalizeBodyBlocks(body.contentBlocks);
  const fallbackBlocks = contentBlocks.length ? contentBlocks : legacyContentToBlocks(body.content);
  if (!fallbackBlocks.length) {
    return res.status(400).json({ error: "Add at least one structured body block." });
  }
  const content = bodyBlocksToLegacyContent(fallbackBlocks);
  const validatedSection = await validateEditorialSection(body.sectionId || null);
  if ("error" in validatedSection) {
    return res.status(400).json({ error: validatedSection.error });
  }

  const slug = await uniqueSlug(body.seo.slug || body.title);
  const nextStatus =
    body.action === "publish" && canPublishArticles(session.user.role)
      ? "APPROVED"
      : body.action === "submit"
      ? getNextStatusForSubmission(session.user.role)
      : "DRAFT";
  const publishedAt =
    body.action === "publish" && canPublishArticles(session.user.role) ? new Date() : null;

  const article = await prisma.article.create({
    data: {
      title: body.title,
      sectionId: validatedSection.section?.id || null,
      dek: body.dek,
      excerpt: body.excerpt,
      heroImage: body.heroImage || null,
      heroAlt: body.heroAlt || null,
      content,
      contentBlocks: serializeBodyBlocks(fallbackBlocks),
      status: nextStatus,
      publishedAt,
      submittedAt: body.action === "submit" ? new Date() : null,
      authorId: session.user.id,
      seo: {
        create: {
          slug,
          metaTitle: body.seo.metaTitle || null,
          metaDesc: body.seo.metaDesc || null,
          canonical:
            body.seo.canonical
              ? normalizeAbsoluteUrl(body.seo.canonical)
              : absoluteUrl(
                  getPreferredArticlePath({
                    slug,
                    section: validatedSection.section
                  })
                ),
          socialTitle: body.seo.socialTitle || body.seo.metaTitle || body.title,
          socialDescription:
            body.seo.socialDescription || body.seo.metaDesc || body.dek || body.excerpt || null,
          socialImage: body.seo.socialImage || body.heroImage || null,
          noindex: body.seo.noindex
        }
      }
    },
    include: {
      seo: true,
      section: {
        include: {
          parent: true
        }
      }
    }
  });

  await recordArticleRevision({
    articleId: article.id,
    createdById: session.user.id,
    action:
      body.action === "publish"
        ? "PUBLISHED"
        : body.action === "submit"
        ? "SUBMITTED"
        : "DRAFT_SAVED",
    snapshot: {
      title: article.title,
      sectionId: article.sectionId,
      dek: article.dek,
      excerpt: article.excerpt,
      heroImage: article.heroImage,
      heroAlt: article.heroAlt,
      content: article.content,
      contentBlocks: fallbackBlocks,
      status: article.status,
      previewToken: article.previewToken,
      publishedAt: article.publishedAt,
      scheduledPublishAt: article.scheduledPublishAt,
      scheduledUnpublishAt: article.scheduledUnpublishAt,
      seo: {
        slug: article.seo?.slug,
        metaTitle: article.seo?.metaTitle,
        metaDesc: article.seo?.metaDesc,
        canonical: article.seo?.canonical,
        socialTitle: article.seo?.socialTitle,
        socialDescription: article.seo?.socialDescription,
        socialImage: article.seo?.socialImage,
        noindex: article.seo?.noindex
      }
    }
  });

  let revalidation: Awaited<ReturnType<typeof revalidatePaths>> | null = null;
  if (article.publishedAt) {
    revalidation = await revalidatePaths(res, articleRevalidateTargets(article), {
      req,
      context: {
        entity: "article",
        articleId: article.id,
        trigger: "article.create"
      },
      criticalPaths: articleCriticalRevalidateTargets([article]),
      warmPaths: articleWarmTargets([article])
    });
  }

  return res.status(201).json({
    id: article.id,
    revalidation
  });
}
