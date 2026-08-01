import type { GetStaticProps, InferGetStaticPropsType } from "next";
import Link from "next/link";
import { Container } from "../components/home/Container";
import { PublicPageShell } from "../components/public/PublicPageShell";
import { SeoHead } from "../components/seo/SeoHead";
import { StructuredData } from "../components/seo/StructuredData";
import { getVisibleCategoryTree } from "../lib/categories/queries";
import { getActiveHomepageData } from "../lib/cms/queries/homepage";
import { absoluteUrl } from "../lib/cms/utils";
import { buildCollectionPageStructuredData, buildSeo } from "../lib/seo";
import { getSectionPath } from "../lib/taxonomy";

export const getStaticProps: GetStaticProps = async () => {
  const [homepage, categories] = await Promise.all([
    getActiveHomepageData(),
    getVisibleCategoryTree()
  ]);

  if (!homepage) {
    return {
      notFound: true,
      revalidate: 60
    };
  }

  return {
    props: JSON.parse(
      JSON.stringify({
        homepage,
        categories
      })
    ),
    revalidate: 60
  };
};

export default function SectionsPage({
  homepage,
  categories
}: InferGetStaticPropsType<typeof getStaticProps>) {
  const seo = buildSeo({
    title: "London News Sections",
    description: "Browse the full London News category structure, from homepage desks to specialist reporting sections.",
    canonical: absoluteUrl("/sections")
  });

  const topNavCategories = categories.filter((category: any) => category.showInTopNav);

  return (
    <>
      <SeoHead {...seo} />
      <StructuredData
        id="sections-structured-data"
        data={buildCollectionPageStructuredData({
          url: seo.canonical,
          name: "London News Sections",
          description: seo.description,
          breadcrumbs: [
            { name: "Home", item: absoluteUrl("/") },
            { name: "Sections", item: seo.canonical }
          ]
        })}
      />

      <PublicPageShell
        homepage={homepage}
        eyebrow="Taxonomy"
        title="Desks and topics"
        description="London News supports a fuller editorial category structure, with primary desks, specialist topic pages, and a dedicated classifieds section that sits outside the article taxonomy."
        actions={
          <>
            {topNavCategories.map((category: any) => (
              <Link
                key={category.id}
                href={getSectionPath(category)}
                className="rounded-full border border-black/10 bg-white/60 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#334255] backdrop-blur-sm transition hover:border-black/30 hover:bg-white"
              >
                {category.navLabel || category.name}
              </Link>
            ))}
          </>
        }
      >
        <Container className="space-y-10">
          <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {categories.map((category: any) => {
              const totalPublished =
                category._count.articles +
                category.children.reduce((sum: number, child: any) => sum + child._count.articles, 0);
              const isDedicatedSection = category.slug === "classifieds";
              const cardLabel = isDedicatedSection
                ? "Dedicated marketplace"
                : category.children.length > 0
                  ? "Legacy desk with topic pages"
                  : "Primary desk";
              const actionLabel = isDedicatedSection ? "Open classifieds" : "Open section";

              return (
                <article
                  key={category.id}
                  className="overflow-hidden rounded-[2rem] border border-black/6 bg-white/80 shadow-[0_22px_50px_rgba(17,24,39,0.08)] backdrop-blur-sm"
                >
                  <div className="h-1 w-full bg-[var(--accent)]" />
                  <div className="p-6">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                        {cardLabel}
                      </span>
                      {category.showInTopNav ? (
                        <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#7b5a00]">
                          Top nav
                        </span>
                      ) : null}
                    </div>

                    <h2 className="mt-4 font-sans text-[2rem] font-semibold leading-[0.96] tracking-[-0.04em] text-[#1a2433]">
                      {category.name}
                    </h2>
                    <p className="mt-3 text-sm leading-7 text-zinc-700">
                      {category.description || `Coverage from the ${category.name} desk.`}
                    </p>

                    <div className="mt-5 flex flex-wrap gap-3 text-[11px] uppercase tracking-[0.22em] text-zinc-500">
                      <span>{totalPublished} published</span>
                      <span>{category._count.children} child desks</span>
                      <span>{getSectionPath(category)}</span>
                    </div>

                    {category.children.length > 0 ? (
                      <div className="mt-6 flex flex-wrap gap-3">
                        {category.children.map((topic: any) => (
                          <Link
                            key={topic.id}
                            href={getSectionPath(topic)}
                            className="rounded-full border border-black/10 bg-stone-50 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-700 transition hover:border-black/30 hover:bg-white"
                          >
                            {topic.navLabel || topic.name}
                            {typeof topic._count.articles === "number" ? ` (${topic._count.articles})` : ""}
                          </Link>
                        ))}
                      </div>
                    ) : null}

                    <div className="mt-6">
                      <Link
                        href={getSectionPath(category)}
                        className="inline-flex items-center border-b border-zinc-900 pb-1 ln-ui text-[12px] font-bold uppercase tracking-[0.16em] text-zinc-950 transition hover:text-[#7b5a00]"
                      >
                        {actionLabel}
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        </Container>
      </PublicPageShell>
    </>
  );
}
