import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { z } from "zod";
import { authOptions } from "../../auth/[...nextauth]";
import {
  canDeleteArticles,
  canEditArticle,
  canPublishArticles,
  getNextStatusForSubmission
} from "../../../../utils/auth";
import { bodyBlocksToLegacyContent, legacyContentToBlocks, normalizeBodyBlocks, serializeBodyBlocks } from "../../../../lib/articles/blocks";
import { articleEditorInclude, toArticleEditorPayload } from "../../../../lib/articles/editor-payload";
import { recordArticleRevision } from "../../../../lib/articles/revisions";
import { absoluteUrl } from "../../../../lib/cms/utils";
import { getPreferredArticlePath } from "../../../../lib/legacy-routes";
import { normalizeAbsoluteUrl } from "../../../../lib/seo";
import { applyRouteRateLimit, requireMethod, requireSameOrigin, setNoStore } from "../../../../lib/server/api";
import {
  articleCriticalRevalidateTargets,
  articleMutationRevalidateTargets,
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
  action: z.enum(["draft", "submit", "publish", "unpublish"]).default("draft")
});

async function uniqueSlug(id: string, input: string) {
  const base = slugify(input) || `story-${Date.now()}`;
  for (let attempt = 0; attempt < 25; attempt += 1) {
    const candidate = withNumericSuffix(base, attempt);
    const existing = await prisma.articleSEO.findUnique({ where: { slug: candidate } });
    if (!existing || existing.articleId === id) return candidate;
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

  const { id } = req.query as { id: string };
  const article = await prisma.article.findUnique({
    where: { id },
    include: {
      author: true,
      ...articleEditorInclude
    }
  });

  if (!article) return res.status(404).json({ error: "Article not found." });

  if (req.method === "GET") {
    return res.status(200).json(toArticleEditorPayload(article));
  }

  if (req.method === "DELETE") {
    if (!canDeleteArticles(session.user.role)) {
      return res.status(403).json({ error: "You do not have permission to delete articles." });
    }
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

    const wasPublished = Boolean(article.publishedAt);
    await prisma.article.delete({ where: { id } });

    if (wasPublished) {
      await revalidatePaths(res, articleRevalidateTargets(article), {
        req,
        context: {
          entity: "article",
          articleId: article.id,
          trigger: "article.delete"
        },
        criticalPaths: articleCriticalRevalidateTargets([article])
      });
    }

    return res.status(204).end();
  }

  if (!requireMethod(req, res, ["GET", "PUT", "DELETE"])) return;
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

  if (
    !canEditArticle({
      role: session.user.role,
      userId: session.user.id,
      authorId: article.authorId,
      status: article.status
    })
  ) {
    return res.status(403).json({ error: "You cannot edit this article." });
  }

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

  const slug = await uniqueSlug(id, body.seo.slug || body.title);
  const canPublish = canPublishArticles(session.user.role);
  const nextStatus =
    body.action === "publish" && canPublish
      ? "APPROVED"
      : body.action === "unpublish" && canPublish
      ? "APPROVED"
      : body.action === "submit"
      ? getNextStatusForSubmission(session.user.role)
      : canPublish &&
        (article.status === "APPROVED" ||
          Boolean(article.publishedAt) ||
          Boolean(article.scheduledPublishAt) ||
          Boolean(article.scheduledUnpublishAt))
      ? "APPROVED"
      : "DRAFT";
  const publishedAt =
    body.action === "publish" && canPublish
      ? article.publishedAt || new Date()
      : body.action === "unpublish" && canPublish
      ? null
      : body.action === "draft" && !canPublish
      ? null
      : article.publishedAt;

  const saved = await prisma.article.update({
    where: { id },
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
      submittedAt: body.action === "submit" ? new Date() : article.submittedAt,
      publishedAt,
      scheduledPublishAt:
        body.action === "publish" || body.action === "unpublish" ? null : article.scheduledPublishAt,
      scheduledUnpublishAt:
        body.action === "unpublish" ? null : article.scheduledUnpublishAt,
      seo: {
        upsert: {
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
          },
          update: {
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
      }
    },
    include: articleEditorInclude
  });

  await recordArticleRevision({
    articleId: saved.id,
    createdById: session.user.id,
    action:
      body.action === "publish"
        ? "PUBLISHED"
        : body.action === "unpublish"
        ? "UNPUBLISHED"
        : body.action === "submit"
        ? "SUBMITTED"
        : "DRAFT_SAVED",
    snapshot: {
      title: saved.title,
      sectionId: saved.sectionId,
      dek: saved.dek,
      excerpt: saved.excerpt,
      heroImage: saved.heroImage,
      heroAlt: saved.heroAlt,
      content: saved.content,
      contentBlocks: fallbackBlocks,
      status: saved.status,
      previewToken: saved.previewToken,
      publishedAt: saved.publishedAt,
      scheduledPublishAt: saved.scheduledPublishAt,
      scheduledUnpublishAt: saved.scheduledUnpublishAt,
      seo: {
        slug: saved.seo?.slug,
        metaTitle: saved.seo?.metaTitle,
        metaDesc: saved.seo?.metaDesc,
        canonical: saved.seo?.canonical,
        socialTitle: saved.seo?.socialTitle,
        socialDescription: saved.seo?.socialDescription,
        socialImage: saved.seo?.socialImage,
        noindex: saved.seo?.noindex
      }
    }
  });

  let revalidation: Awaited<ReturnType<typeof revalidatePaths>> | null = null;
  if (article.publishedAt || saved.publishedAt || body.action === "unpublish") {
    revalidation = await revalidatePaths(
      res,
      articleMutationRevalidateTargets(article, saved),
      {
        req,
        context: {
          entity: "article",
          articleId: saved.id,
          trigger: "article.update",
          action: body.action
        },
        criticalPaths: articleCriticalRevalidateTargets([article, saved]),
        warmPaths: articleWarmTargets([article, saved])
      }
    );
  }

  return res.status(200).json({
    ...toArticleEditorPayload(saved),
    revalidation
  });
}