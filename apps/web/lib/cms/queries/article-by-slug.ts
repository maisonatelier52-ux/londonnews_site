import { prisma } from "../../../utils/prisma";
import type { ArticleView } from "../../cms-types";
import { absoluteUrl, mapArticleToStoryCard, stripHtml, truncate } from "../utils";
import { getSectionPath, toTaxonomyLink } from "../../taxonomy";
import { logEvent } from "../../server/logger";
import { bodyBlocksToPlainText, parseStoredBodyBlocks } from "../../articles/blocks";
import { buildArticlePreviewUrl } from "../../articles/workflow";
import { getPreferredArticlePath, shouldPreferLegacyArticlePath } from "../../legacy-routes";

export async function listPublishedArticleSlugs() {
  try {
    const rows = await prisma.articleSEO.findMany({
      where: {
        article: {
          status: "APPROVED",
          publishedAt: { not: null },
        },
      },
      select: { slug: true },
    });
    return rows.map((row) => row.slug);
  } catch (error) {
    logEvent("error", "article.list_slugs_failed", { error });
    throw error;
  }
}

async function mapArticleRowToView(article: any, slug: string): Promise<ArticleView> {
  const bodyBlocks = parseStoredBodyBlocks(article.contentBlocks, article.content);
  const plainBody = bodyBlocksToPlainText(bodyBlocks);
  const preferredArticlePath = getPreferredArticlePath({
    slug,
    section: article.section
  });
  const canonicalPath = shouldPreferLegacyArticlePath({
    canonical: article.seo?.canonical,
    slug,
    section: article.section
  })
    ? absoluteUrl(preferredArticlePath)
    : article.seo?.canonical || absoluteUrl(preferredArticlePath);

  const [relatedRows, mostReadRows] = await Promise.all([
    prisma.article.findMany({
      where: {
        status: "APPROVED",
        publishedAt: { not: null },
        id: { not: article.id },
        sectionId: article.sectionId || undefined,
      },
      include: {
        seo: true,
        section: {
          include: {
            parent: true
          }
        }
      },
      orderBy: { publishedAt: "desc" },
      take: 3,
    }),
    prisma.article.findMany({
      where: {
        status: "APPROVED",
        publishedAt: { not: null },
        id: { not: article.id },
      },
      include: {
        seo: true,
        section: {
          include: {
            parent: true
          }
        }
      },
      orderBy: { publishedAt: "desc" },
      take: 3,
    }),
  ]);

  return {
    slug,
    section: article.section?.name || article.section?.slug || "News",
    sectionSlug: article.section?.slug || undefined,
    sectionHref: getSectionPath(article.section),
    parentSection: article.section?.parent ? toTaxonomyLink(article.section.parent) : undefined,
    title: article.title,
    dek: article.dek || article.excerpt || truncate(stripHtml(plainBody || article.content), 220),
    publishedAt: (article.publishedAt || article.updatedAt || article.createdAt).toISOString(),
    updatedAt: article.updatedAt.toISOString(),
    heroImage:
      article.heroImage ||
      article.seo?.socialImage ||
      "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1400&q=80",
    heroAlt: article.heroAlt || article.title,
    body: bodyBlocks,
    author: {
      id: article.author?.id || undefined,
      name: article.author?.name || "London News Staff",
      role: "Reporter",
      bio:
        article.author?.bio ||
        "This author profile can be enhanced from the CMS user profile.",
      avatar: article.author?.avatar || undefined,
    },
    correctionNotes: (article.corrections || []).map((correction: any) => ({
      id: correction.id,
      note: correction.note,
      createdAt: correction.createdAt.toISOString(),
      createdByName: correction.createdBy?.name || undefined
    })),
    relatedStories: relatedRows.map((row) => mapArticleToStoryCard(row)),
    mostRead: mostReadRows.map((row) => mapArticleToStoryCard(row)),
    events: [
      { category: "Briefing", time: "08:30", title: "Morning markets update" },
      { category: "Panel", time: "13:00", title: "Housing and rates discussion" },
      { category: "Community", time: "18:00", title: "Local business networking event" },
    ],
    seo: {
      title: article.seo?.metaTitle || article.title,
      description:
        article.seo?.metaDesc ||
        article.dek ||
        article.excerpt ||
        truncate(stripHtml(plainBody || article.content), 160),
      image: article.seo?.socialImage || article.heroImage || undefined,
      canonical: canonicalPath,
      noindex: article.seo?.noindex || false,
      socialTitle: article.seo?.socialTitle || article.seo?.metaTitle || article.title,
      socialDescription:
        article.seo?.socialDescription ||
        article.seo?.metaDesc ||
        article.dek ||
        article.excerpt ||
        truncate(stripHtml(plainBody || article.content), 160)
    },
  };
}

export async function getArticlePageDataBySlug(slug: string): Promise<ArticleView | null> {
  try {
    const seoRow = await prisma.articleSEO.findUnique({
      where: { slug },
      include: {
        article: {
          include: {
            author: true,
            section: {
              include: {
                parent: true
              }
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
              }
            },
            seo: true,
          },
        },
      },
    });

    const article = seoRow?.article;
    if (!article || article.status !== "APPROVED" || !article.publishedAt) {
      return null;
    }
    return mapArticleRowToView(article, slug);
  } catch (error) {
    logEvent("error", "article.query_failed", { slug, error });
    throw error;
  }
}

export async function getArticlePreviewDataByToken(token: string): Promise<{ article: ArticleView; previewUrl: string } | null> {
  try {
    const article = await prisma.article.findUnique({
      where: { previewToken: token },
      include: {
        author: true,
        section: {
          include: {
            parent: true
          }
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
          }
        },
        seo: true,
      },
    });

    if (!article) {
      return null;
    }

    const slug = article.seo?.slug || "article-preview";
    return {
      article: await mapArticleRowToView(article, slug),
      previewUrl: buildArticlePreviewUrl(token)
    };
  } catch (error) {
    logEvent("error", "article.preview_query_failed", { token, error });
    throw error;
  }
}
