import { prisma } from "../../../utils/prisma";
import type { CategoryView } from "../../cms-types";
import { mapArticleToStoryCard } from "../utils";
import { getSectionPath, toTaxonomyLink } from "../../taxonomy";
import { logEvent } from "../../server/logger";

const publishedWhere = {
  status: "APPROVED" as const,
  publishedAt: { not: null }
};

const storyInclude = {
  seo: true,
  section: {
    include: {
      parent: true
    }
  }
};

function buildCategoryView(params: {
  kind: "category" | "topic";
  section: any;
  parent?: any | null;
  childTopics?: any[];
  siblingTopics?: any[];
  storyRows: any[];
  mostReadRows: any[];
  articleCount: number;
}): CategoryView {
  const [lead, ...rest] = params.storyRows;

  return {
    kind: params.kind,
    slug: params.section.slug,
    name: params.section.name,
    description:
      params.section.description ||
      `Latest reporting, analysis, and features from the ${params.section.name} desk.`,
    href: getSectionPath(params.section),
    parent: params.parent ? toTaxonomyLink(params.parent) : null,
    childTopics: (params.childTopics || []).map((topic) => toTaxonomyLink(topic)),
    siblingTopics: (params.siblingTopics || []).map((topic) => toTaxonomyLink(topic)),
    leadStory: lead ? mapArticleToStoryCard(lead, { kickerOverride: "Lead Story" }) : null,
    featuredStories: rest.slice(0, 2).map((row) => mapArticleToStoryCard(row)),
    latestStories: rest.slice(2, 6).map((row) => mapArticleToStoryCard(row)),
    mostRead: params.mostReadRows.map((row) => mapArticleToStoryCard(row)),
    articleCount: params.articleCount,
    seo: {
      title:
        params.section.seoTitle ||
        (params.parent
          ? `${params.section.name} | ${params.parent.name} | London News`
          : `${params.section.name} | London News`),
      description:
        params.section.seoDescription ||
        params.section.description ||
        `Latest ${params.section.name.toLowerCase()} stories, analysis, and explainers from London News.`,
      image:
        params.section.seoImage ||
        lead?.heroImage ||
        lead?.seo?.socialImage ||
        undefined
    }
  };
}

export async function listCategorySlugs() {
  try {
    const rows = await prisma.section.findMany({
      where: {
        isVisible: true,
        parentId: null,
        slug: {
          not: "classifieds"
        }
      },
      select: { slug: true },
      orderBy: [{ position: "asc" }, { slug: "asc" }]
    });
    return rows.map((row) => row.slug);
  } catch (error) {
    logEvent("error", "category.list_slugs_failed", { error });
    throw error;
  }
}

export async function listTopicSlugs() {
  try {
    const rows = await prisma.section.findMany({
      where: {
        isVisible: true,
        parentId: { not: null }
      },
      select: { slug: true },
      orderBy: [{ position: "asc" }, { slug: "asc" }]
    });
    return rows.map((row) => row.slug);
  } catch (error) {
    logEvent("error", "topic.list_slugs_failed", { error });
    throw error;
  }
}

export async function getSectionRouteBySlug(slug: string) {
  try {
    const section = await prisma.section.findUnique({
      where: { slug },
      select: {
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
      return null;
    }

    return getSectionPath(section);
  } catch (error) {
    logEvent("error", "section.route_lookup_failed", { slug, error });
    return null;
  }
}

export async function getCategoryPageDataBySlug(slug: string): Promise<CategoryView | null> {
  try {
    const section = await prisma.section.findUnique({
      where: { slug },
      include: {
        children: {
          where: { isVisible: true },
          select: {
            id: true,
            name: true,
            slug: true,
            navLabel: true,
            description: true,
            parentId: true,
            _count: {
              select: {
                articles: {
                  where: publishedWhere
                }
              }
            }
          },
          orderBy: [{ position: "asc" }, { name: "asc" }]
        }
      }
    });

    if (!section) {
      return null;
    }

    if (section.slug === "classifieds") {
      return null;
    }

    if (section.parentId) {
      return null;
    }

    const sectionIds = [section.id, ...section.children.map((child) => child.id)];
    const articleWhere = {
      ...publishedWhere,
      sectionId: { in: sectionIds }
    };

    const [storyRows, mostReadRows, articleCount] = await Promise.all([
      prisma.article.findMany({
        where: articleWhere,
        include: storyInclude,
        orderBy: [{ publishedAt: "desc" }],
        take: 12
      }),
      prisma.article.findMany({
        where: articleWhere,
        include: storyInclude,
        orderBy: [{ viewCount: "desc" }, { publishedAt: "desc" }],
        take: 3
      }),
      prisma.article.count({
        where: articleWhere
      })
    ]);

    return buildCategoryView({
      kind: "category",
      section,
      childTopics: section.children,
      siblingTopics: [],
      storyRows,
      mostReadRows,
      articleCount
    });
  } catch (error) {
    logEvent("error", "category.query_failed", { slug, error });
    throw error;
  }
}

export async function getTopicPageDataBySlug(slug: string): Promise<CategoryView | null> {
  try {
    const section = await prisma.section.findUnique({
      where: { slug },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            slug: true,
            navLabel: true,
            description: true,
            children: {
              where: { isVisible: true },
              select: {
                id: true,
                name: true,
                slug: true,
                navLabel: true,
                description: true,
                parentId: true,
                _count: {
                  select: {
                    articles: {
                      where: publishedWhere
                    }
                  }
                }
              },
              orderBy: [{ position: "asc" }, { name: "asc" }]
            }
          }
        }
      }
    });

    if (!section || !section.parentId || !section.parent) {
      return null;
    }

    const articleWhere = {
      ...publishedWhere,
      sectionId: section.id
    };

    const [storyRows, mostReadRows, articleCount] = await Promise.all([
      prisma.article.findMany({
        where: articleWhere,
        include: storyInclude,
        orderBy: [{ publishedAt: "desc" }],
        take: 12
      }),
      prisma.article.findMany({
        where: articleWhere,
        include: storyInclude,
        orderBy: [{ viewCount: "desc" }, { publishedAt: "desc" }],
        take: 3
      }),
      prisma.article.count({
        where: articleWhere
      })
    ]);

    return buildCategoryView({
      kind: "topic",
      section,
      parent: section.parent,
      childTopics: [],
      siblingTopics: section.parent.children.filter((topic) => topic.slug !== section.slug),
      storyRows,
      mostReadRows,
      articleCount
    });
  } catch (error) {
    logEvent("error", "topic.query_failed", { slug, error });
    throw error;
  }
}
