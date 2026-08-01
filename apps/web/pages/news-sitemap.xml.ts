import type { GetServerSideProps } from "next";
import { absoluteUrl } from "../lib/cms/utils";
import { getPreferredArticlePath } from "../lib/legacy-routes";
import { prisma } from "../utils/prisma";

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  let body = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`;

  try {
    const articles = await prisma.articleSEO.findMany({
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
            title: true,
            publishedAt: true,
            updatedAt: true,
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
        article: {
          publishedAt: "desc"
        }
      },
      take: 1000
    });

    const urls = articles
      .map((article) => {
        const loc = absoluteUrl(
          getPreferredArticlePath({
            slug: article.slug,
            section: article.article.section
          })
        );
        const lastmod = (article.article.updatedAt || article.article.publishedAt || new Date()).toISOString();
        const publicationDate = (article.article.publishedAt || article.article.updatedAt || new Date()).toISOString();
        const title = article.article.title || "London News story";

        return `<url><loc>${escapeXml(loc)}</loc><lastmod>${escapeXml(lastmod)}</lastmod><news:news xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"><news:publication><news:name>London News</news:name><news:language>en</news:language></news:publication><news:publication_date>${escapeXml(publicationDate)}</news:publication_date><news:title>${escapeXml(title)}</news:title></news:news></url>`;
      })
      .join("");

    body = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">${urls}</urlset>`;
  } catch {
    body = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"></urlset>`;
  }

  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");
  res.write(body);
  res.end();

  return {
    props: {}
  };
};

export default function NewsSitemapXml() {
  return null;
}
