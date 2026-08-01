import type { GetStaticProps, InferGetStaticPropsType } from "next";
import Link from "next/link";
import { Container } from "../../components/home/Container";
import { PublicPageShell } from "../../components/public/PublicPageShell";
import { SeoHead } from "../../components/seo/SeoHead";
import { StructuredData } from "../../components/seo/StructuredData";
import type { ClassifiedCardView } from "../../lib/cms-types";
import { getFeaturedPublicClassifiedListings, getPublicClassifiedListings } from "../../lib/cms/queries/classifieds";
import { getActiveHomepageData } from "../../lib/cms/queries/homepage";
import { absoluteUrl } from "../../lib/cms/utils";
import { buildCollectionPageStructuredData, buildSeo } from "../../lib/seo";

export const getStaticProps: GetStaticProps = async () => {
  const [homepage, listings, featuredListings] = await Promise.all([
    getActiveHomepageData(),
    getPublicClassifiedListings(),
    getFeaturedPublicClassifiedListings()
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
        listings,
        featuredListings
      })
    ),
    revalidate: 60
  };
};

export default function ClassifiedsIndexPage({
  homepage,
  listings,
  featuredListings
}: InferGetStaticPropsType<typeof getStaticProps>) {
  const seo = buildSeo({
    title: "London News Classifieds",
    description: "Browse London News classifieds for homes, cars, devices, services, and local business listings across the capital.",
    image: listings[0]?.image,
    canonical: absoluteUrl("/classifieds")
  });

  const categories: string[] = Array.from(
    new Set(listings.map((listing: ClassifiedCardView) => String(listing.category)))
  );

  return (
    <>
      <SeoHead {...seo} />
      <StructuredData
        id="classifieds-structured-data"
        data={buildCollectionPageStructuredData({
          url: seo.canonical,
          name: "London News Classifieds",
          description: seo.description,
          image: seo.image,
          breadcrumbs: [
            { name: "Home", item: absoluteUrl("/") },
            { name: "Classifieds", item: seo.canonical }
          ]
        })}
      />

      <PublicPageShell
        homepage={homepage}
        eyebrow="Marketplace"
        title="Classifieds"
        description="A newspaper-style market board for London property, vehicles, devices, business opportunities, and trusted local services."
        actions={
          <>
            <Link
              href="/classifieds/submit"
              className="bg-[var(--accent)] px-5 py-3 text-center ln-ui text-[11px] font-bold uppercase tracking-[0.16em] text-black transition hover:bg-[#ebbb32]"
            >
              Submit a listing
            </Link>
            <Link
              href="/admin/classifieds"
              className="border border-black/10 bg-white/55 px-5 py-3 text-center ln-ui text-[11px] font-bold uppercase tracking-[0.16em] text-[#243144] transition hover:border-black hover:text-black"
            >
              Admin workflow
            </Link>
          </>
        }
      >
        <Container className="space-y-10 lg:space-y-12">
          <section className="rounded-[2rem] border border-black/6 bg-white/82 p-6 shadow-[0_24px_70px_rgba(11,16,32,0.08)] backdrop-blur-sm md:p-8">
            <div className="flex flex-col gap-4 border-b border-black/8 pb-5 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="h-[2px] w-16 bg-[var(--accent)]" />
                <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#6a7280]">Browse by category</p>
                <h2 className="mt-3 font-sans text-[2.35rem] font-semibold leading-[0.98] tracking-[-0.04em] text-[#1a2433]">
                  London listings across the paper
                </h2>
              </div>
              <p className="max-w-2xl text-sm leading-8 text-[#56606d]">
                The classifieds desk is built like the rest of London News: moderated, structured, and easy to browse by reader intent instead of generic marketplace clutter.
              </p>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              {categories.map((category) => (
                <span
                  key={category}
                  className="rounded-full border border-black/10 bg-[#f8f3eb] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#324255]"
                >
                  {category}
                </span>
              ))}
            </div>
          </section>

          {featuredListings.length > 0 ? (
            <section className="space-y-6">
              <div className="flex flex-col gap-4 border-b border-black/8 pb-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <div className="h-[2px] w-16 bg-[var(--accent)]" />
                  <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#6a7280]">Featured selection</p>
                  <h2 className="mt-3 font-sans text-[2.35rem] font-semibold leading-[0.98] tracking-[-0.04em] text-[#1a2433]">
                    Editor-picked listings
                  </h2>
                </div>
              </div>

              <section className="grid gap-6 lg:grid-cols-2">
                {featuredListings.map((listing: ClassifiedCardView) => (
                  <article
                    key={listing.slug}
                    className="overflow-hidden rounded-[2rem] border border-black/6 bg-white/82 shadow-[0_24px_70px_rgba(11,16,32,0.08)] backdrop-blur-sm"
                  >
                    <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
                      <div className="relative min-h-[280px] bg-[#d8ddd9]">
                        <img src={listing.image} alt={listing.title} className="absolute inset-0 h-full w-full object-cover" />
                      </div>

                      <div className="flex flex-col gap-5 p-6">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="text-[11px] uppercase tracking-[0.24em] text-[#6a7280]">{listing.category}</span>
                          <span className="rounded-full bg-[var(--accent)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-black">
                            Featured
                          </span>
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-[#56606d]">{listing.location}</p>
                          <h3 className="mt-2 font-sans text-[2rem] font-semibold leading-[0.98] tracking-[-0.04em] text-[#1a2433]">
                            <Link href={`/classifieds/${listing.slug}`} className="transition hover:opacity-65">
                              {listing.title}
                            </Link>
                          </h3>
                        </div>

                        <p className="text-sm leading-8 text-[#56606d]">{listing.summary}</p>

                        <div className="mt-auto flex items-center justify-between gap-4">
                          <span className="text-lg font-semibold text-[#1a2433]">{listing.price}</span>
                          <Link
                            href={`/classifieds/${listing.slug}`}
                            className="ln-ui text-[11px] font-bold uppercase tracking-[0.16em] text-[#1f2b3b] transition hover:opacity-65"
                          >
                            View listing
                          </Link>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </section>
            </section>
          ) : null}

          <section className="space-y-6">
            <div className="flex flex-col gap-4 border-b border-black/8 pb-4 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="h-[2px] w-16 bg-[var(--accent)]" />
                <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#6a7280]">Live board</p>
                <h2 className="mt-3 font-sans text-[2.35rem] font-semibold leading-[0.98] tracking-[-0.04em] text-[#1a2433]">
                  Latest listings
                </h2>
              </div>
              <span className="text-[11px] uppercase tracking-[0.24em] text-[#6a7280]">{listings.length} live items</span>
            </div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {listings.map((listing: ClassifiedCardView) => (
                <article
                  key={listing.slug}
                  className="rounded-[2rem] border border-black/6 bg-white/82 p-5 shadow-[0_20px_60px_rgba(11,16,32,0.08)] backdrop-blur-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="text-[11px] uppercase tracking-[0.24em] text-[#6a7280]">{listing.category}</span>
                    <span className="text-[11px] uppercase tracking-[0.24em] text-[#8a93a0]">{listing.location}</span>
                  </div>

                  <h3 className="mt-4 font-sans text-[1.75rem] font-semibold leading-[1] tracking-[-0.03em] text-[#1a2433]">
                    <Link href={`/classifieds/${listing.slug}`} className="transition hover:opacity-65">
                      {listing.title}
                    </Link>
                  </h3>
                  <p className="mt-3 text-sm leading-8 text-[#56606d]">{listing.summary}</p>

                  <div className="mt-5 flex items-center justify-between gap-4">
                    <span className="text-base font-semibold text-[#1a2433]">{listing.price}</span>
                    <Link
                      href={`/classifieds/${listing.slug}`}
                      className="ln-ui text-[11px] font-bold uppercase tracking-[0.16em] text-[#1f2b3b] transition hover:opacity-65"
                    >
                      Open listing
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </Container>
      </PublicPageShell>
    </>
  );
}
