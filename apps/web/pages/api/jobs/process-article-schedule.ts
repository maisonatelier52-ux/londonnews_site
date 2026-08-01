import type { NextApiRequest, NextApiResponse } from "next";
import { parseStoredBodyBlocks } from "../../../lib/articles/blocks";
import { recordArticleRevision } from "../../../lib/articles/revisions";
import {
  articleCriticalRevalidateTargets,
  articleMutationRevalidateTargets,
  articleWarmTargets,
  revalidatePaths
} from "../../../lib/server/revalidate";
import { logEvent } from "../../../lib/server/logger";
import { requireMethod, setNoStore } from "../../../lib/server/api";
import { getCronAuthSecret } from "../../../lib/security/env";
import { prisma } from "../../../utils/prisma";

function readCronToken(req: NextApiRequest) {
  const bearer = req.headers.authorization;
  if (bearer?.startsWith("Bearer ")) {
    return bearer.slice("Bearer ".length);
  }

  return req.headers["x-cron-token"] || req.query.token;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  setNoStore(res);
  if (!requireMethod(req, res, ["GET", "POST"])) return;

  const token = readCronToken(req);
  const cronSecret = getCronAuthSecret();

  if (!cronSecret && process.env.NODE_ENV === "production") {
    return res.status(503).json({ error: "Cron auth secret is not configured." });
  }

  if (cronSecret && token !== cronSecret) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const now = new Date();
  const duePublishes = await prisma.article.findMany({
    where: {
      scheduledPublishAt: { lte: now }
    },
    include: {
      seo: true,
      section: {
        include: {
          parent: true
        }
      }
    },
    orderBy: { scheduledPublishAt: "asc" }
  });

  const dueUnpublishes = await prisma.article.findMany({
    where: {
      publishedAt: { not: null },
      scheduledUnpublishAt: { lte: now }
    },
    include: {
      seo: true,
      section: {
        include: {
          parent: true
        }
      }
    },
    orderBy: { scheduledUnpublishAt: "asc" }
  });

  const revalidateQueue: string[] = [];
  const criticalRevalidateQueue: string[] = [];
  const warmQueue: string[] = [];
  let published = 0;
  let unpublished = 0;

  for (const article of duePublishes) {
    const saved = await prisma.article.update({
      where: { id: article.id },
      data: {
        status: "APPROVED",
        publishedAt: article.publishedAt || now,
        scheduledPublishAt: null
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
      articleId: saved.id,
      action: "PUBLISH_SCHEDULE_EXECUTED",
      snapshot: {
        title: saved.title,
        sectionId: saved.sectionId,
        dek: saved.dek,
        excerpt: saved.excerpt,
        heroImage: saved.heroImage,
        heroAlt: saved.heroAlt,
        content: saved.content,
        contentBlocks: parseStoredBodyBlocks(saved.contentBlocks, saved.content),
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

    revalidateQueue.push(...articleMutationRevalidateTargets(article, saved));
    criticalRevalidateQueue.push(...articleCriticalRevalidateTargets([article, saved]));
    warmQueue.push(...articleWarmTargets([article, saved]));
    published += 1;
  }

  for (const article of dueUnpublishes) {
    const saved = await prisma.article.update({
      where: { id: article.id },
      data: {
        publishedAt: null,
        scheduledUnpublishAt: null
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
      articleId: saved.id,
      action: "UNPUBLISH_SCHEDULE_EXECUTED",
      snapshot: {
        title: saved.title,
        sectionId: saved.sectionId,
        dek: saved.dek,
        excerpt: saved.excerpt,
        heroImage: saved.heroImage,
        heroAlt: saved.heroAlt,
        content: saved.content,
        contentBlocks: parseStoredBodyBlocks(saved.contentBlocks, saved.content),
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

    revalidateQueue.push(...articleMutationRevalidateTargets(article, saved));
    criticalRevalidateQueue.push(...articleCriticalRevalidateTargets([article, saved]));
    warmQueue.push(...articleWarmTargets([article, saved]));
    unpublished += 1;
  }

  if (revalidateQueue.length > 0) {
    await revalidatePaths(res, revalidateQueue, {
      req,
      context: {
        entity: "article",
        trigger: "article.schedule_cron",
        published,
        unpublished
      },
      criticalPaths: criticalRevalidateQueue,
      warmPaths: warmQueue
    });
  }

  logEvent("info", "article.cron_schedule_complete", { published, unpublished });

  return res.status(200).json({ ok: true, published, unpublished });
}
