import type { GetStaticPaths, GetStaticProps, InferGetStaticPropsType } from "next";
import { SectionPageScreen } from "../../components/editorial/SectionPageScreen";
import { FooterMark } from "../../components/home/FooterMark";
import { TopNav } from "../../components/home/TopNav";
import { SeoHead } from "../../components/seo/SeoHead";
import { StructuredData } from "../../components/seo/StructuredData";
import {
  getSectionRouteBySlug,
  getTopicPageDataBySlug,
  listTopicSlugs
} from "../../lib/cms/queries/category-by-slug";
import { getActiveHomepageData } from "../../lib/cms/queries/homepage";
import { absoluteUrl } from "../../lib/cms/utils";
import { getLegacyCollectionPath } from "../../lib/legacy-routes";
import { buildCollectionPageStructuredData, buildSeo } from "../../lib/seo";

export const getStaticPaths: GetStaticPaths = async () => {
  const slugs = await listTopicSlugs();
  return {
    paths: slugs.map((slug) => ({ params: { slug } })),
    fallback: "blocking"
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slug = params?.slug as string;
  const [topic, homepage] = await Promise.all([
    getTopicPageDataBySlug(slug),
    getActiveHomepageData()
  ]);

  if (!topic) {
    const resolvedRoute = await getSectionRouteBySlug(slug);
    if (resolvedRoute && resolvedRoute !== `/topics/${slug}`) {
      return {
        redirect: {
          destination: resolvedRoute,
          permanent: false
        }
      };
    }
  }

  if (!topic || !homepage) {
    return {
      notFound: true,
      revalidate: 60
    };
  }

  return {
    props: JSON.parse(
      JSON.stringify({
        topic,
        homepage
      })
    ),
    revalidate: 60
  };
};

export default function TopicPage({
  topic,
  homepage
}: InferGetStaticPropsType<typeof getStaticProps>) {
  const hasPublishedStories = Boolean(topic.leadStory);
  const canonicalPath =
    getLegacyCollectionPath({
      slug: topic.slug,
      parentSlug: topic.parent?.slug || null,
      parentId: topic.parent?.slug ? "legacy-parent" : null
    }) || topic.href;
  const seo = buildSeo({
    title: topic.seo?.title || `${topic.name} | London News`,
    description: topic.seo?.description || topic.description,
    image: topic.seo?.image,
    canonical: absoluteUrl(canonicalPath),
    noindex: !hasPublishedStories
  });

  return (
    <>
      <SeoHead {...seo} />
      <StructuredData
        id="topic-structured-data"
        data={buildCollectionPageStructuredData({
          url: seo.canonical,
          name: `${topic.name} | London News`,
          description: seo.description,
          image: seo.image,
          breadcrumbs: [
            { name: "Home", item: absoluteUrl("/") },
            ...(topic.parent
              ? [{ name: topic.parent.name, item: absoluteUrl(topic.parent.href) }]
              : []),
            { name: topic.name, item: seo.canonical }
          ]
        })}
      />

      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.42),transparent_24%),linear-gradient(180deg,#f3efe8_0%,#efe8dd_100%)] text-zinc-950">
        <TopNav data={homepage} />

        <main className="py-12 lg:py-16">
          <SectionPageScreen
            section={topic}
            canonicalPath={canonicalPath}
            eyebrow={topic.parent ? `${topic.parent.name} topic` : "Topic"}
          />
        </main>

        <FooterMark data={homepage} />
      </div>
    </>
  );
}
