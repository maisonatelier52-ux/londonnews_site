import type { GetServerSideProps } from "next";
import { classifiedListings } from "../lib/classifieds-data";
import { absoluteUrl } from "../lib/cms/utils";
import { getLegacyCollectionPath, getPreferredArticlePath } from "../lib/legacy-routes";
import { getSectionPath } from "../lib/taxonomy";
import { prisma } from "../utils/prisma";

type SitemapEntry = {
  loc: string;
  lastmod?: string;
};

function isSitemapEntry(entry: SitemapEntry | null): entry is SitemapEntry {
  return Boolean(entry);
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function buildSitemapXml(entries: SitemapEntry[]) {
  const urls = entries
    .map((entry) => {
      const lastmod = entry.lastmod ? `<lastmod>${escapeXml(entry.lastmod)}</lastmod>` : "";
      return `<url><loc>${escapeXml(entry.loc)}</loc>${lastmod}</url>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;
}

function dedupeEntries(entries: SitemapEntry[]) {
  const byLocation = new Map<string, SitemapEntry>();

  for (const entry of entries) {
    const existing = byLocation.get(entry.loc);

    if (!existing) {
      byLocation.set(entry.loc, entry);
      continue;
    }

    if (entry.lastmod && (!existing.lastmod || entry.lastmod > existing.lastmod)) {
      byLocation.set(entry.loc, entry);
    }
  }

  return Array.from(byLocation.values());
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  let entries: SitemapEntry[] = [
    {
      loc: absoluteUrl("/"),
      lastmod: new Date().toISOString()
    },
    {
      loc: absoluteUrl("/sections"),
      lastmod: new Date().toISOString()
    },
    {
      loc: absoluteUrl("/classifieds"),
      lastmod: new Date().toISOString()
    }
  ];

  try {
    const [sections, articles, classifieds] = await Promise.all([
      prisma.section.findMany({
        where: {
          articles: {
            some: {
              status: "APPROVED",
              publishedAt: { not: null }
            }
          }
        },
        select: {
          slug: true,
          parentId: true,
          updatedAt: true
        },
        orderBy: { slug: "asc" }
      }),
      prisma.articleSEO.findMany({
        where: {
          article: {
            status: "APPROVED",
            publishedAt: { not: null }
          }
        },
        select: {
          slug: true,
          article: {
            select: {
              updatedAt: true,
              publishedAt: true,
              section: {
                select: {
                  slug: true,
                  parentId: true,
                  parent: {
                    select: {
                      slug: true
                    }
                  }
                }
              }
            }
          }
        },
        orderBy: {
          slug: "asc"
        }
      }),
      prisma.classifiedListing.findMany({
        where: {
          status: "APPROVED",
          publishedAt: { not: null },
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }]
        },
        select: {
          slug: true,
          updatedAt: true,
          publishedAt: true
        },
        orderBy: [{ featured: "desc" }, { publishedAt: "desc" }]
      })
    ]);

    entries = [
      {
        loc: absoluteUrl("/"),
        lastmod: new Date().toISOString()
      },
      {
        loc: absoluteUrl("/sections"),
        lastmod: new Date().toISOString()
      },
      {
        loc: absoluteUrl("/classifieds"),
        lastmod: new Date().toISOString()
      },
      ...sections.map((section) => ({
        loc: absoluteUrl(getSectionPath(section)),
        lastmod: section.updatedAt.toISOString()
      })),
      ...sections
        .map((section): SitemapEntry | null => {
          const legacyPath = getLegacyCollectionPath(section);
          return legacyPath
            ? {
                loc: absoluteUrl(legacyPath),
                lastmod: section.updatedAt.toISOString()
              }
            : null;
        })
        .filter(isSitemapEntry),
      ...(classifieds.length > 0
        ? classifieds.map((listing) => ({
            loc: absoluteUrl(`/classifieds/${listing.slug}`),
            lastmod: (listing.updatedAt || listing.publishedAt || new Date()).toISOString()
          }))
        : classifiedListings.map((listing) => ({
            loc: absoluteUrl(`/classifieds/${listing.slug}`),
            lastmod: listing.postedAt
          }))),
      ...articles.map((article) => ({
        loc: absoluteUrl(
          getPreferredArticlePath({
            slug: article.slug,
            section: article.article.section
          })
        ),
        lastmod: (article.article.updatedAt || article.article.publishedAt || new Date()).toISOString()
      })),
    ];
  } catch {
    entries = [
      {
        loc: absoluteUrl("/"),
        lastmod: new Date().toISOString()
      },
      {
        loc: absoluteUrl("/sections"),
        lastmod: new Date().toISOString()
      },
      {
        loc: absoluteUrl("/classifieds"),
        lastmod: new Date().toISOString()
      }
    ];
  }

  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");
  res.write(buildSitemapXml(dedupeEntries(entries)));
  res.end();

  return {
    props: {}
  };
};

export default function SitemapXml() {
  return null;
}
