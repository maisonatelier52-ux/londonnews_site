import type { GetStaticPaths, GetStaticProps, InferGetStaticPropsType } from "next";
import { SectionPageScreen } from "../../components/editorial/SectionPageScreen";
import { FooterMark } from "../../components/home/FooterMark";
import { TopNav } from "../../components/home/TopNav";
import { SeoHead } from "../../components/seo/SeoHead";
import { StructuredData } from "../../components/seo/StructuredData";
import {
  getCategoryPageDataBySlug,
  getSectionRouteBySlug,
  listCategorySlugs
} from "../../lib/cms/queries/category-by-slug";
import { getActiveHomepageData } from "../../lib/cms/queries/homepage";
import { buildCollectionPageStructuredData, buildSeo } from "../../lib/seo";
import { absoluteUrl } from "../../lib/cms/utils";
import { getLegacyCollectionPath } from "../../lib/legacy-routes";

export const getStaticPaths: GetStaticPaths = async () => {
  const slugs = await listCategorySlugs();
  return {
    paths: slugs.map((slug) => ({ params: { slug } })),
    fallback: "blocking",
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slug = params?.slug as string;
  const [category, homepage] = await Promise.all([
    getCategoryPageDataBySlug(slug),
    getActiveHomepageData(),
  ]);

  if (category && category.href !== `/category/${slug}`) {
    return {
      redirect: {
        destination: category.href,
        permanent: false
      }
    };
  }

  if (!category) {
    const resolvedRoute = await getSectionRouteBySlug(slug);
    if (resolvedRoute && resolvedRoute !== `/category/${slug}`) {
      return {
        redirect: {
          destination: resolvedRoute,
          permanent: false
        }
      };
    }
  }

  if (!category || !homepage) {
    return {
      notFound: true,
      revalidate: 60,
    };
  }

  return {
    props: JSON.parse(
      JSON.stringify({
        category,
        homepage,
      })
    ),
    revalidate: 60,
  };
};

export default function CategoryPage({
  category,
  homepage,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  const hasPublishedStories = Boolean(category.leadStory);
  const canonicalPath = getLegacyCollectionPath({ slug: category.slug }) || category.href;
  const seo = buildSeo({
    title: category.seo?.title || `${category.name} | London News`,
    description: category.seo?.description || category.description,
    image: category.seo?.image,
    canonical: absoluteUrl(canonicalPath),
    noindex: !hasPublishedStories,
  });

  return (
    <>
      <SeoHead {...seo} />
      <StructuredData
        id="category-structured-data"
        data={buildCollectionPageStructuredData({
          url: seo.canonical,
          name: `${category.name} | London News`,
          description: seo.description,
          image: seo.image,
          breadcrumbs: [
            { name: "Home", item: absoluteUrl("/") },
            { name: category.name, item: seo.canonical }
          ]
        })}
      />

      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.42),transparent_24%),linear-gradient(180deg,#f3efe8_0%,#efe8dd_100%)] text-zinc-950">
        <TopNav data={homepage} />

        <main className="py-12 lg:py-16">
          <SectionPageScreen section={category} canonicalPath={canonicalPath} />
        </main>

        <FooterMark data={homepage} />
      </div>
    </>
  );
}
