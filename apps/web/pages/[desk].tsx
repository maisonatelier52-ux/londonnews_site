import type { GetStaticPaths, GetStaticProps, InferGetStaticPropsType } from "next";
import { SectionPageScreen } from "../components/editorial/SectionPageScreen";
import { FooterMark } from "../components/home/FooterMark";
import { TopNav } from "../components/home/TopNav";
import { SeoHead } from "../components/seo/SeoHead";
import { StructuredData } from "../components/seo/StructuredData";
import {
  getCategoryPageDataBySlug,
  getTopicPageDataBySlug
} from "../lib/cms/queries/category-by-slug";
import { getActiveHomepageData } from "../lib/cms/queries/homepage";
import { absoluteUrl } from "../lib/cms/utils";
import { getLegacyDeskConfig, listLegacyDeskSlugs } from "../lib/legacy-routes";
import { buildCollectionPageStructuredData, buildSeo } from "../lib/seo";

export const getStaticPaths: GetStaticPaths = async () => ({
  paths: listLegacyDeskSlugs().map((desk) => ({ params: { desk } })),
  fallback: "blocking"
});

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const desk = params?.desk as string;
  const config = getLegacyDeskConfig(desk);

  if (!config) {
    return {
      notFound: true,
      revalidate: 60
    };
  }

  const [section, homepage] = await Promise.all([
    config.kind === "topic"
      ? getTopicPageDataBySlug(config.sectionSlug)
      : getCategoryPageDataBySlug(config.sectionSlug),
    getActiveHomepageData()
  ]);

  if (!section || !homepage) {
    return {
      notFound: true,
      revalidate: 60
    };
  }

  return {
    props: JSON.parse(
      JSON.stringify({
        desk,
        section,
        homepage
      })
    ),
    revalidate: 60
  };
};

export default function LegacyDeskPage({
  desk,
  section,
  homepage
}: InferGetStaticPropsType<typeof getStaticProps>) {
  const canonicalPath = `/${desk}`;
  const hasPublishedStories = Boolean(section.leadStory);
  const seo = buildSeo({
    title: section.seo?.title || `${section.name} | London News`,
    description: section.seo?.description || section.description,
    image: section.seo?.image,
    canonical: absoluteUrl(canonicalPath),
    noindex: !hasPublishedStories
  });

  return (
    <>
      <SeoHead {...seo} />
      <StructuredData
        id="legacy-desk-structured-data"
        data={buildCollectionPageStructuredData({
          url: seo.canonical,
          name: `${section.name} | London News`,
          description: seo.description,
          image: seo.image,
          breadcrumbs: [
            { name: "Home", item: absoluteUrl("/") },
            ...(section.parent ? [{ name: section.parent.name, item: absoluteUrl(section.parent.href) }] : []),
            { name: section.name, item: seo.canonical }
          ]
        })}
      />

      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.42),transparent_24%),linear-gradient(180deg,#f3efe8_0%,#efe8dd_100%)] text-zinc-950">
        <TopNav data={homepage} />

        <main className="py-12 lg:py-16">
          <SectionPageScreen
            section={section}
            canonicalPath={canonicalPath}
            eyebrow={section.kind === "topic" ? `${section.parent?.name || "News"} topic` : "Category"}
          />
        </main>

        <FooterMark data={homepage} />
      </div>
    </>
  );
}
