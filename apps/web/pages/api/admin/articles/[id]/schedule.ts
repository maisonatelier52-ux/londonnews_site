import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { z } from "zod";
import { authOptions } from "../../../auth/[...nextauth]";
import { articleEditorInclude, toArticleEditorPayload } from "../../../../../lib/articles/editor-payload";
import { recordArticleRevision } from "../../../../../lib/articles/revisions";
import { applyRouteRateLimit, requireMethod, requireSameOrigin, setNoStore } from "../../../../../lib/server/api";
import { canPublishArticles } from "../../../../../utils/auth";
import { prisma } from "../../../../../utils/prisma";

const scheduleSchema = z.object({
  scheduledPublishAt: z.string().optional().nullable(),
  scheduledUnpublishAt: z.string().optional().nullable(),
  clearPublishSchedule: z.boolean().optional().default(false),
  clearUnpublishSchedule: z.boolean().optional().default(false)
});

function parseOptionalDate(value?: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "invalid";
  }
  return parsed;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  setNoStore(res);
  if (!requireMethod(req, res, ["POST"])) return;
  if (!requireSameOrigin(req, res)) return;

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user) return res.status(401).json({ error: "Unauthorized" });
  if (!canPublishArticles(session.user.role)) {
    return res.status(403).json({ error: "Only editorial publishers can schedule article visibility." });
  }

  const ok = await applyRouteRateLimit(
    req,
    res,
    {
      keyPrefix: "admin-article-schedule",
      max: 20,
      windowMs: 10 * 60 * 1000
    },
    "Too many schedule changes from this connection. Please try again shortly."
  );
  if (!ok) return;

  const parsed = scheduleSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid schedule payload." });
  }

  const { id } = req.query as { id: string };
  const article = await prisma.article.findUnique({
    where: { id },
    include: articleEditorInclude
  });

  if (!article) {
    return res.status(404).json({ error: "Article not found." });
  }

  const publishAtInput = parseOptionalDate(parsed.data.scheduledPublishAt);
  const unpublishAtInput = parseOptionalDate(parsed.data.scheduledUnpublishAt);

  if (publishAtInput === "invalid" || unpublishAtInput === "invalid") {
    return res.status(400).json({ error: "Schedule dates must be valid datetimes." });
  }

  const publishAt =
    parsed.data.clearPublishSchedule
      ? null
      : parsed.data.scheduledPublishAt !== undefined
      ? publishAtInput
      : article.scheduledPublishAt;
  const unpublishAt =
    parsed.data.clearUnpublishSchedule
      ? null
      : parsed.data.scheduledUnpublishAt !== undefined
      ? unpublishAtInput
      : article.scheduledUnpublishAt;

  const changedPublish =
    parsed.data.clearPublishSchedule ||
    parsed.data.scheduledPublishAt !== undefined;
  const changedUnpublish =
    parsed.data.clearUnpublishSchedule ||
    parsed.data.scheduledUnpublishAt !== undefined;

  if (!changedPublish && !changedUnpublish) {
    return res.status(400).json({ error: "No schedule change was provided." });
  }

  const now = new Date();
  if (publishAt && publishAt <= now) {
    return res.status(400).json({ error: "Scheduled publish must be set in the future." });
  }

  if (unpublishAt && unpublishAt <= now) {
    return res.status(400).json({ error: "Scheduled unpublish must be set in the future." });
  }

  if (publishAt && article.publishedAt) {
    return res.status(400).json({ error: "This story is already live. Use unpublish scheduling instead." });
  }

  const effectivePublishAt = article.publishedAt || publishAt;
  if (unpublishAt && !effectivePublishAt) {
    return res.status(400).json({ error: "Schedule a publish or publish the story before scheduling an unpublish." });
  }

  if (publishAt && unpublishAt && unpublishAt <= publishAt) {
    return res.status(400).json({ error: "Scheduled unpublish must be later than scheduled publish." });
  }

  const saved = await prisma.article.update({
    where: { id: article.id },
    data: {
      status: publishAt || article.publishedAt ? "APPROVED" : article.status,
      scheduledPublishAt: publishAt,
      scheduledUnpublishAt: unpublishAt
    },
    include: articleEditorInclude
  });

  const action =
    changedPublish && changedUnpublish
      ? "PUBLICATION_SCHEDULE_UPDATED"
      : changedPublish
      ? publishAt
        ? "PUBLISH_SCHEDULED"
        : "PUBLISH_SCHEDULE_CLEARED"
      : unpublishAt
      ? "UNPUBLISH_SCHEDULED"
      : "UNPUBLISH_SCHEDULE_CLEARED";

  await recordArticleRevision({
    articleId: saved.id,
    createdById: session.user.id,
    action,
    snapshot: {
      title: saved.title,
      sectionId: saved.sectionId,
      dek: saved.dek,
      excerpt: saved.excerpt,
      heroImage: saved.heroImage,
      heroAlt: saved.heroAlt,
      content: saved.content,
      contentBlocks: toArticleEditorPayload(saved).contentBlocks,
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

  return res.status(200).json(toArticleEditorPayload(saved));
}
