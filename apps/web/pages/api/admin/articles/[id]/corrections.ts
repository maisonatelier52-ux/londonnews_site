import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { z } from "zod";
import { authOptions } from "../../../auth/[...nextauth]";
import { articleEditorInclude, toArticleEditorPayload } from "../../../../../lib/articles/editor-payload";
import { parseStoredBodyBlocks } from "../../../../../lib/articles/blocks";
import { recordArticleRevision } from "../../../../../lib/articles/revisions";
import { applyRouteRateLimit, requireMethod, requireSameOrigin, setNoStore } from "../../../../../lib/server/api";
import {
  articleCriticalRevalidateTargets,
  articleRevalidateTargets,
  articleWarmTargets,
  revalidatePaths
} from "../../../../../lib/server/revalidate";
import { canReviewArticles } from "../../../../../utils/auth";
import { prisma } from "../../../../../utils/prisma";

const correctionSchema = z.object({
  note: z.string().trim().min(12).max(800)
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  setNoStore(res);
  if (!requireMethod(req, res, ["POST"])) return;
  if (!requireSameOrigin(req, res)) return;

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user) return res.status(401).json({ error: "Unauthorized" });
  if (!canReviewArticles(session.user.role)) {
    return res.status(403).json({ error: "Only editorial staff can add correction notes." });
  }

  const ok = await applyRouteRateLimit(
    req,
    res,
    {
      keyPrefix: "admin-article-corrections",
      max: 20,
      windowMs: 10 * 60 * 1000
    },
    "Too many correction updates from this connection. Please try again shortly."
  );
  if (!ok) return;

  const parsed = correctionSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Correction notes must be between 12 and 800 characters." });
  }

  const { id } = req.query as { id: string };
  const article = await prisma.article.findUnique({
    where: { id },
    include: articleEditorInclude
  });

  if (!article) {
    return res.status(404).json({ error: "Article not found." });
  }

  await prisma.articleCorrection.create({
    data: {
      articleId: article.id,
      createdById: session.user.id,
      note: parsed.data.note
    }
  });

  await recordArticleRevision({
    articleId: article.id,
    createdById: session.user.id,
    action: "CORRECTION_NOTE_ADDED",
    note: parsed.data.note,
    snapshot: {
      title: article.title,
      sectionId: article.sectionId,
      dek: article.dek,
      excerpt: article.excerpt,
      heroImage: article.heroImage,
      heroAlt: article.heroAlt,
      content: article.content,
      contentBlocks: parseStoredBodyBlocks(article.contentBlocks, article.content),
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

  const refreshed = await prisma.article.findUnique({
    where: { id: article.id },
    include: articleEditorInclude
  });

  if (!refreshed) {
    return res.status(404).json({ error: "Article not found after correction update." });
  }

  let revalidation: Awaited<ReturnType<typeof revalidatePaths>> | null = null;
  if (refreshed.publishedAt) {
    revalidation = await revalidatePaths(res, articleRevalidateTargets(refreshed), {
      req,
      context: {
        entity: "article",
        articleId: refreshed.id,
        trigger: "article.correction_note"
      },
      criticalPaths: articleCriticalRevalidateTargets([refreshed]),
      warmPaths: articleWarmTargets([refreshed])
    });
  }

  return res.status(200).json({
    ...toArticleEditorPayload(refreshed),
    revalidation
  });
}
