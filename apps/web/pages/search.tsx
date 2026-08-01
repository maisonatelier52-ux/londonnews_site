import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import Link from "next/link";
import { Container } from "../components/home/Container";
import { PublicPageShell } from "../components/public/PublicPageShell";
import { SeoHead } from "../components/seo/SeoHead";
import { getActiveHomepageData } from "../lib/cms/queries/homepage";
import { absoluteUrl } from "../lib/cms/utils";
import { searchSite, type SearchHit } from "../lib/search/query";
import { buildSeo } from "../lib/seo";

export const getServerSideProps: GetServerSideProps = async ({ query }) => {
  const homepage = await getActiveHomepageData();
  if (!homepage) {
    return { notFound: true };
  }

  const searchQuery = typeof query.q === "string" ? query.q.trim() : "";
  const results = searchQuery ? await searchSite(searchQuery).catch(() => []) : [];

  return {
    props: JSON.parse(JSON.stringify({ homepage, query: searchQuery, results }))
  };
};

export default function SearchPage({
  homepage,
  query,
  results
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const seo = buildSeo({
    title: "Search London News",
    description: "Search London News across articles, desks, topics, classifieds, and public information pages.",
    canonical: absoluteUrl("/search"),
    noindex: true
  });
  const groupedResults: Record<SearchHit["kind"], SearchHit[]> = {
    article: [],
    classified: [],
    desk: [],
    topic: [],
    page: []
  };
  for (const result of results as SearchHit[]) {
    groupedResults[result.kind].push(result);
  }

  return (
    <>
      <SeoHead {...seo} />
      <PublicPageShell
        homepage={homepage}
        eyebrow="Search"
        title="Search London News"
        description="Look across published coverage, desks, topics, classifieds, and public information pages from one route."
      >
        <Container className="space-y-8">
          <section className="border border-black/8 bg-white/70 p-7 backdrop-blur-sm lg:p-8">
            <form action="/search" method="get" className="grid gap-3 lg:grid-cols-[1fr_auto]">
              <input
                type="search"
                name="q"
                defaultValue={query}
                placeholder="Search London politics, markets, culture, classifieds..."
                className="border border-black/10 bg-[#f8f4ec] px-4 py-4 text-base text-zinc-950 placeholder:text-zinc-500 focus:border-black focus:outline-none"
              />
              <button
                type="submit"
                className="bg-[var(--accent)] px-6 py-4 text-center ln-ui text-[11px] font-bold uppercase tracking-[0.16em] text-black transition hover:bg-[#ebbb32]"
              >
                Search
              </button>
            </form>
          </section>

          {query ? (
            <section className="space-y-5">
              <div className="flex items-center justify-between gap-4">
                <h2 className="font-sans text-[2rem] font-semibold leading-[1] tracking-[-0.03em] text-[#1a2433]">
                  {results.length} result{results.length === 1 ? "" : "s"} for “{query}”
                </h2>
              </div>

              {results.length ? (
                <div className="space-y-8">
                  {Object.entries(groupedResults).map(([kind, items]) => (
                    <div key={kind} className="space-y-4">
                      <h3 className="ln-ui text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6a7280]">
                        {kind}
                      </h3>
                      <div className="grid gap-5">
                        {items.map((item: SearchHit) => (
                          <article key={`${item.kind}-${item.href}`} className="border border-black/8 bg-white/70 p-6 backdrop-blur-sm">
                            <p className="ln-ui text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6a7280]">
                              {item.label}
                            </p>
                            <h4 className="mt-3 font-sans text-[2rem] font-semibold leading-[1] tracking-[-0.03em] text-[#1a2433]">
                              <Link href={item.href} className="transition hover:opacity-65">
                                {item.title}
                              </Link>
                            </h4>
                            <p className="mt-4 text-sm leading-8 text-[#56606d]">{item.summary}</p>
                          </article>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <article className="border border-black/8 bg-white/70 p-6 backdrop-blur-sm">
                  <p className="text-sm leading-8 text-[#56606d]">
                    No results matched this query. Try a headline, desk name, topic, public-policy page, or a classifieds term such as property, events, or theatre.
                  </p>
                </article>
              )}
            </section>
          ) : (
            <section className="grid gap-6 xl:grid-cols-3">
              {homepage.nav.slice(0, 3).map((item: any) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="border border-black/8 bg-white/70 p-7 backdrop-blur-sm transition hover:border-black"
                >
                  <p className="ln-ui text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6a7280]">Suggested desk</p>
                  <h2 className="mt-4 font-sans text-[2rem] font-semibold leading-[1] tracking-[-0.03em] text-[#1a2433]">
                    {item.label}
                  </h2>
                  <p className="mt-4 text-sm leading-8 text-[#56606d]">
                    Start with the {item.label} coverage route.
                  </p>
                </Link>
              ))}
            </section>
          )}
        </Container>
      </PublicPageShell>
    </>
  );
}
