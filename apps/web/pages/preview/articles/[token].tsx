import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import { ArticlePageScreen } from "../../../components/editorial/ArticlePageScreen";
import { SeoHead } from "../../../components/seo/SeoHead";
import { StructuredData } from "../../../components/seo/StructuredData";
import { getArticlePreviewDataByToken } from "../../../lib/cms/queries/article-by-slug";
import { getActiveHomepageData } from "../../../lib/cms/queries/homepage";
import { absoluteUrl } from "../../../lib/cms/utils";
import { buildArticleStructuredData, buildSeo, deriveArticleKeywords } from "../../../lib/seo";
import { setNoStore } from "../../../lib/server/api";

export const getServerSideProps: GetServerSideProps = async ({ params, res }) => {
  setNoStore(res);
  const token = params?.token as string;
  const [preview, homepage] = await Promise.all([
    getArticlePreviewDataByToken(token),
    getActiveHomepageData().catch(() => null)
  ]);

  if (!preview) {
    return { notFound: true };
  }

  return {
    props: {
      article: JSON.parse(JSON.stringify(preview.article)),
      previewUrl: preview.previewUrl,
      homepage: homepage ? JSON.parse(JSON.stringify(homepage)) : null
    }
  };
};

export default function ArticlePreviewPage({
  article,
  previewUrl,
  homepage
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const keywords = deriveArticleKeywords({
    title: article.title,
    section: article.section,
    authorName: article.author?.name,
    slug: article.slug
  });
  const seo = buildSeo({
    title: `${article.seo?.title || article.title} | Preview`,
    description: article.seo?.description || article.dek,
    image: article.seo?.image || article.heroImage,
    canonical: previewUrl,
    type: "article",
    noindex: true,
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
        id="article-preview-structured-data"
        data={buildArticleStructuredData({
          url: previewUrl,
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
            { name: article.title, item: previewUrl }
          ]
        })}
      />
      <ArticlePageScreen
        article={article}
        homepage={homepage}
        previewLabel="Article preview • not indexed"
      />
    </>
  );
}
