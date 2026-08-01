import type { Prisma } from "@prisma/client";
import { parseStoredBodyBlocks } from "./blocks";
import { buildArticlePreviewUrl } from "./workflow";
import { getPreferredArticlePath, shouldPreferLegacyArticlePath } from "../legacy-routes";

export const articleEditorInclude = {
  seo: true,
  section: {
    include: {
      parent: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      }
    }
  },
  revisions: {
    include: {
      createdBy: {
        select: {
          name: true
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    },
    take: 10
  },
  corrections: {
    include: {
      createdBy: {
        select: {
          name: true
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    },
    take: 12
  }
} satisfies Prisma.ArticleInclude;

export type ArticleEditorRecord = Prisma.ArticleGetPayload<{
  include: typeof articleEditorInclude;
}>;

export function toArticleEditorPayload(article: ArticleEditorRecord) {
  const preferredPath = getPreferredArticlePath({
    slug: article.seo?.slug || "",
    section: article.section
  });
  const canonical =
    shouldPreferLegacyArticlePath({
      canonical: article.seo?.canonical,
      slug: article.seo?.slug || "",
      section: article.section
    })
      ? preferredPath
      : article.seo?.canonical || "";

  return {
    id: article.id,
    title: article.title,
    sectionId: article.sectionId || "",
    dek: article.dek || "",
    excerpt: article.excerpt || "",
    heroImage: article.heroImage || "",
    heroAlt: article.heroAlt || "",
    content: article.content,
    contentBlocks: parseStoredBodyBlocks(article.contentBlocks, article.content),
    status: article.status,
    publishedAt: article.publishedAt?.toISOString() || null,
    scheduledPublishAt: article.scheduledPublishAt?.toISOString() || null,
    scheduledUnpublishAt: article.scheduledUnpublishAt?.toISOString() || null,
    previewToken: article.previewToken,
    previewUrl: buildArticlePreviewUrl(article.previewToken),
    seo: {
      slug: article.seo?.slug || "",
      metaTitle: article.seo?.metaTitle || "",
      metaDesc: article.seo?.metaDesc || "",
      canonical,
      socialTitle: article.seo?.socialTitle || "",
      socialDescription: article.seo?.socialDescription || "",
      socialImage: article.seo?.socialImage || "",
      noindex: article.seo?.noindex || false
    },
    revisions: article.revisions.map((revision) => ({
      id: revision.id,
      action: revision.action,
      note: revision.note || null,
      createdAt: revision.createdAt.toISOString(),
      createdByName: revision.createdBy?.name || null
    })),
    corrections: article.corrections.map((correction) => ({
      id: correction.id,
      note: correction.note,
      createdAt: correction.createdAt.toISOString(),
      createdByName: correction.createdBy?.name || null
    }))
  };
}
