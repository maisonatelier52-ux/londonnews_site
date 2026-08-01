import type { GetStaticPaths, GetStaticProps, InferGetStaticPropsType } from "next";
import { ArticlePageScreen } from "../../components/editorial/ArticlePageScreen";
import { SeoHead } from "../../components/seo/SeoHead";
import { StructuredData } from "../../components/seo/StructuredData";
import { getArticlePageDataBySlug } from "../../lib/cms/queries/article-by-slug";
import { getActiveHomepageData } from "../../lib/cms/queries/homepage";
import { absoluteUrl } from "../../lib/cms/utils";
import {
  getLegacyDeskConfig,
  getLegacyDeskForSection,
  getPreferredArticlePath,
  matchesLegacyDesk
} from "../../lib/legacy-routes";
import {
  buildArticleStructuredData,
  buildSeo,
  deriveArticleKeywords
} from "../../lib/seo";
import { prisma } from "../../utils/prisma";

export const getStaticPaths: GetStaticPaths = async () => {
  const rows = await prisma.articleSEO.findMany({
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
    }
  });

  const paths = rows.reduce<Array<{ params: { desk: string; slug: string } }>>((all, row) => {
      const desk = getLegacyDeskForSection(row.article.section);
      if (desk) {
        all.push({ params: { desk, slug: row.slug } });
      }
      return all;
    }, []);

  return {
    paths,
    fallback: "blocking"
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const desk = params?.desk as string;
  const slug = params?.slug as string;
  const legacyDesk = getLegacyDeskConfig(desk);

  if (!legacyDesk) {
    return {
      notFound: true,
      revalidate: 60
    };
  }

  const [article, homepage] = await Promise.all([
    getArticlePageDataBySlug(slug),
    getActiveHomepageData()
  ]);

  if (!article || !homepage) {
    return {
      notFound: true,
      revalidate: 60
    };
  }

  const matches = matchesLegacyDesk(
    {
      slug: article.sectionSlug || null,
      parentSlug: article.parentSection?.slug || null,
      parentId: article.parentSection?.slug ? "legacy-parent" : null
    },
    desk
  );

  if (!matches) {
    const destination = getPreferredArticlePath({
      slug,
      section: {
        slug: article.sectionSlug || null,
        parentSlug: article.parentSection?.slug || null,
        parentId: article.parentSection?.slug ? "legacy-parent" : null
      }
    });

    if (destination !== `/articles/${slug}`) {
      return {
        redirect: {
          destination,
          permanent: false
        }
      };
    }

    return {
      notFound: true,
      revalidate: 60
    };
  }

  return {
    props: JSON.parse(
      JSON.stringify({
        article,
        homepage,
        desk
      })
    ),
    revalidate: 60
  };
};

export default function LegacyArticlePage({
  article,
  homepage,
  desk
}: InferGetStaticPropsType<typeof getStaticProps>) {
  const canonicalPath = `/${desk}/${article.slug}`;
  const keywords = deriveArticleKeywords({
    title: article.title,
    section: article.section,
    authorName: article.author?.name,
    slug: article.slug
  });
  const seo = buildSeo({
    title: article.seo?.title || article.title,
    description: article.seo?.description || article.dek,
    image: article.seo?.image || article.heroImage,
    canonical: absoluteUrl(canonicalPath),
    type: "article",
    noindex: article.seo?.noindex,
    socialTitle: article.seo?.socialTitle,
    socialDescription: article.seo?.socialDescription,
    publishedTime: article.publishedAt,
    modifiedTime: article.updatedAt,
    authorName: article.author?.name,
    section: article.section,
    keywords
  });

  return (
    <>
      <SeoHead {...seo} />
      <StructuredData
        id="legacy-article-structured-data"
        data={buildArticleStructuredData({
          url: seo.canonical,
          title: article.title,
          description: seo.description,
          image: seo.image,
          publishedTime: article.publishedAt,
          modifiedTime: article.updatedAt,
          authorName: article.author?.name || "London News Staff",
          sectionName: article.section,
          bodyBlocks: article.body,
          keywords,
          breadcrumbs: [
            { name: "Home", item: absoluteUrl("/") },
            ...(article.parentSection
              ? [{ name: article.parentSection.name, item: absoluteUrl(article.parentSection.href) }]
              : []),
            {
              name: article.section,
              item: absoluteUrl(`/${desk}`)
            },
            { name: article.title, item: seo.canonical }
          ]
        })}
      />

      <ArticlePageScreen article={article} homepage={homepage} />
    </>
  );
}
