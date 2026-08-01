import { prisma } from "../../utils/prisma";
import { getSectionPath } from "../taxonomy";
import { publicPages } from "../public-pages";
import { logEvent } from "../server/logger";
import { stripHtml, truncate } from "../cms/utils";
import { getLegacyCollectionPath, getPreferredArticlePath } from "../legacy-routes";

export type SearchHit = {
  id: string;
  kind: "article" | "classified" | "desk" | "topic" | "page";
  label: string;
  title: string;
  summary: string;
  href: string;
};

function matchPublicPage(query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  return publicPages
    .filter((page) => {
      const text = [
        page.title,
        page.description,
        page.eyebrow,
        ...page.keywords,
        ...page.sections.flatMap((section) => [section.heading, ...section.paragraphs, ...(section.bullets || [])])
      ]
        .join(" ")
        .toLowerCase();

      return text.includes(normalizedQuery);
    })
    .slice(0, 6)
    .map<SearchHit>((page) => ({
      id: page.slug,
      kind: "page",
      label: page.eyebrow,
      title: page.title,
      summary: page.description,
      href: `/page/${page.slug}`
    }));
}

export async function searchSite(query: string): Promise<SearchHit[]> {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) return [];

  try {
    const [articles, classifieds, sections] = await Promise.all([
      prisma.article.findMany({
        where: {
          status: "APPROVED",
          publishedAt: { not: null },
          OR: [
            { title: { contains: normalizedQuery, mode: "insensitive" } },
            { dek: { contains: normalizedQuery, mode: "insensitive" } },
            { excerpt: { contains: normalizedQuery, mode: "insensitive" } },
            { content: { contains: normalizedQuery, mode: "insensitive" } },
            { seo: { slug: { contains: normalizedQuery, mode: "insensitive" } } },
            { author: { name: { contains: normalizedQuery, mode: "insensitive" } } }
          ]
        },
        include: {
          seo: true,
          section: {
            include: {
              parent: true
            }
          },
          author: true
        },
        orderBy: [{ publishedAt: "desc" }],
        take: 10
      }),
      prisma.classifiedListing.findMany({
        where: {
          status: "APPROVED",
          publishedAt: { not: null },
          OR: [
            { title: { contains: normalizedQuery, mode: "insensitive" } },
            { summary: { contains: normalizedQuery, mode: "insensitive" } },
            { description: { contains: normalizedQuery, mode: "insensitive" } },
            { category: { contains: normalizedQuery, mode: "insensitive" } },
            { location: { contains: normalizedQuery, mode: "insensitive" } }
          ]
        },
        orderBy: [{ featured: "desc" }, { publishedAt: "desc" }],
        take: 8
      }),
      prisma.section.findMany({
        where: {
          isVisible: true,
          OR: [
            { name: { contains: normalizedQuery, mode: "insensitive" } },
            { navLabel: { contains: normalizedQuery, mode: "insensitive" } },
            { slug: { contains: normalizedQuery, mode: "insensitive" } },
            { description: { contains: normalizedQuery, mode: "insensitive" } }
          ]
        },
        include: {
          parent: true
        },
        orderBy: [{ position: "asc" }, { name: "asc" }],
        take: 8
      })
    ]);

    const results: SearchHit[] = [
      ...articles.map((article) => ({
        id: article.id,
        kind: "article" as const,
        label: article.section?.name || "Article",
        title: article.title,
        summary: truncate(article.excerpt || article.dek || stripHtml(article.content), 180),
        href: getPreferredArticlePath({
          slug: article.seo?.slug || article.id,
          section: article.section
        })
      })),
      ...classifieds.map((listing) => ({
        id: listing.id,
        kind: "classified" as const,
        label: "Classified",
        title: listing.title,
        summary: truncate(`${listing.category} • ${listing.location} • ${listing.summary}`, 180),
        href: `/classifieds/${listing.slug}`
      })),
      ...sections.map((section) => ({
        id: section.id,
        kind: section.parentId ? ("topic" as const) : ("desk" as const),
        label: section.parentId ? "Topic" : "Desk",
        title: section.name,
        summary: truncate(section.description || `Browse ${section.name} coverage on London News.`, 180),
        href: getLegacyCollectionPath(section) || getSectionPath(section)
      })),
      ...matchPublicPage(normalizedQuery)
    ];

    return Array.from(new Map(results.map((result) => [`${result.kind}:${result.href}`, result])).values());
  } catch (error) {
    logEvent("error", "search.query_failed", { query: normalizedQuery, error });
    throw error;
  }
}
