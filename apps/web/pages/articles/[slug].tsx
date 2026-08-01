// apps/web/pages/articles/[slug].tsx
import type { GetStaticPaths, GetStaticProps, InferGetStaticPropsType } from "next";
import { ArticlePageScreen } from "../../components/editorial/ArticlePageScreen";
import { SeoHead } from "../../components/seo/SeoHead";
import { StructuredData } from "../../components/seo/StructuredData";
import { getArticlePageDataBySlug, listPublishedArticleSlugs } from "../../lib/cms/queries/article-by-slug";
import { getActiveHomepageData } from "../../lib/cms/queries/homepage";
import {
  absoluteUrl
} from "../../lib/cms/utils";
import {
  buildArticleStructuredData,
  buildSeo,
  deriveArticleKeywords
} from "../../lib/seo";

export const getStaticPaths: GetStaticPaths = async () => {
  const slugs = await listPublishedArticleSlugs();
  return {
    paths: slugs.map((slug) => ({ params: { slug } })),
    fallback: "blocking",
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slug = params?.slug as string;
  const [article, homepage] = await Promise.all([
    getArticlePageDataBySlug(slug),
    getActiveHomepageData(),
  ]);

  if (!article || !homepage) {
    return {
      notFound: true,
      revalidate: 60,
    };
  }

  return {
    props: JSON.parse(
      JSON.stringify({
        article,
        homepage,
      })
    ),
    revalidate: 60,
  };
};

export default function ArticlePage({
  article,
  homepage,
}: InferGetStaticPropsType<typeof getStaticProps>) {
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
    canonical: article.seo?.canonical,
    type: "article",
    noindex: article.seo?.noindex,
    socialTitle: article.seo?.socialTitle,
    socialDescription: article.seo?.socialDescription,
    publishedTime: article.publishedAt,
    modifiedTime: article.updatedAt,
    authorName: article.author?.name,
    section: article.section,
    keywords,
  });

  return (
    <>
      <SeoHead {...seo} />
      <StructuredData
        id="article-structured-data"
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
              item: absoluteUrl(article.sectionHref || `/category/${article.sectionSlug || "news"}`)
            },
            { name: article.title, item: seo.canonical }
          ]
        })}
      />

      <ArticlePageScreen article={article} homepage={homepage} />
    </>
  );
}
