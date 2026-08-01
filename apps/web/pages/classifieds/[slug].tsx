import type { GetStaticPaths, GetStaticProps, InferGetStaticPropsType } from "next";
import Link from "next/link";
import { Container } from "../../components/home/Container";
import { FooterMark } from "../../components/home/FooterMark";
import { TopNav } from "../../components/home/TopNav";
import { ClassifiedEnquiryForm } from "../../components/public/ClassifiedEnquiryForm";
import { SeoHead } from "../../components/seo/SeoHead";
import { StructuredData } from "../../components/seo/StructuredData";
import type { ClassifiedCardView } from "../../lib/cms-types";
import {
  getPublicClassifiedListingBySlug,
  getRelatedPublicClassifiedListings,
  listPublicClassifiedSlugs
} from "../../lib/cms/queries/classifieds";
import { getActiveHomepageData } from "../../lib/cms/queries/homepage";
import { absoluteUrl } from "../../lib/cms/utils";
import { buildBreadcrumbStructuredData, buildSeo } from "../../lib/seo";

export const getStaticPaths: GetStaticPaths = async () => {
  const slugs = await listPublicClassifiedSlugs();
  return {
    paths: slugs.map((slug) => ({
      params: { slug }
    })),
    fallback: "blocking"
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slug = params?.slug as string;
  const [listing, homepage] = await Promise.all([
    getPublicClassifiedListingBySlug(slug),
    getActiveHomepageData()
  ]);

  if (!listing || !homepage) {
    return {
      notFound: true,
      revalidate: 60
    };
  }

  return {
    props: JSON.parse(
      JSON.stringify({
        homepage,
        listing,
        relatedListings: await getRelatedPublicClassifiedListings(slug, listing.category)
      })
    ),
    revalidate: 60
  };
};

export default function ClassifiedListingPage({
  homepage,
  listing,
  relatedListings
}: InferGetStaticPropsType<typeof getStaticProps>) {
  const canonical = absoluteUrl(`/classifieds/${listing.slug}`);
  const seo = buildSeo({
    title: `${listing.title} | London News Classifieds`,
    description: listing.summary,
    image: listing.image,
    canonical
  });

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${canonical}#webpage`,
        url: canonical,
        name: seo.title,
        description: seo.description,
        image: listing.image,
        inLanguage: "en-GB"
      },
      buildBreadcrumbStructuredData({
        url: canonical,
        items: [
          { name: "Home", item: absoluteUrl("/") },
          { name: "Classifieds", item: absoluteUrl("/classifieds") },
          { name: listing.title, item: canonical }
        ]
      })
    ]
  };

  return (
    <>
      <SeoHead {...seo} />
      <StructuredData id="classified-listing-structured-data" data={structuredData} />

      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.42),transparent_24%),linear-gradient(180deg,#f3efe8_0%,#efe8dd_100%)] text-zinc-950">
        <TopNav data={homepage} />

        <main className="pb-12 lg:pb-16">
          <section className="ln-hero-surface border-b border-black/5">
            <Container className="py-10 lg:py-14">
              <div className="grid gap-8 xl:grid-cols-[minmax(0,1.02fr)_420px] xl:items-end">
                <div className="rounded-[2rem] border border-white/45 bg-white/62 p-6 shadow-[0_30px_80px_rgba(11,16,32,0.12)] backdrop-blur-sm md:p-8">
                  <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#6a7280]">
                    <Link href="/classifieds" className="transition hover:text-[#1a2433]">
                      Classifieds
                    </Link>
                    <span>/</span>
                    <span>{listing.category}</span>
                  </div>

                  <div className="mt-6 h-[2px] w-16 bg-[var(--accent)]" />

                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <span className="text-[11px] uppercase tracking-[0.24em] text-[#6a7280]">{listing.category}</span>
                    <span className="rounded-full border border-black/10 bg-white/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#324255]">
                      {listing.location}
                    </span>
                  </div>

                  <h1 className="mt-5 max-w-[860px] font-sans text-[3rem] font-semibold leading-[0.92] tracking-[-0.05em] text-[#1a2433] sm:text-[4rem]">
                    {listing.title}
                  </h1>
                  <p className="mt-5 max-w-[760px] text-base leading-8 text-[#56606d]">{listing.summary}</p>

                  <div className="mt-8 grid gap-4 md:grid-cols-3">
                    <div className="rounded-[1.5rem] border border-black/6 bg-[#f7f1e7] px-4 py-4">
                      <p className="text-[11px] uppercase tracking-[0.22em] text-[#6a7280]">Price</p>
                      <p className="mt-2 text-lg font-semibold text-[#1a2433]">{listing.price}</p>
                    </div>
                    <div className="rounded-[1.5rem] border border-black/6 bg-[#f7f1e7] px-4 py-4">
                      <p className="text-[11px] uppercase tracking-[0.22em] text-[#6a7280]">Posted</p>
                      <p className="mt-2 text-lg font-semibold text-[#1a2433]">
                        {new Date(listing.postedAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric"
                        })}
                      </p>
                    </div>
                    <div className="rounded-[1.5rem] border border-black/6 bg-[#f7f1e7] px-4 py-4">
                      <p className="text-[11px] uppercase tracking-[0.22em] text-[#6a7280]">Seller</p>
                      <p className="mt-2 text-lg font-semibold text-[#1a2433]">{listing.sellerName}</p>
                    </div>
                  </div>
                </div>

                <div className="overflow-hidden rounded-[2rem] border border-black/6 bg-white/42 shadow-[0_30px_80px_rgba(11,16,32,0.14)] backdrop-blur-sm">
                  <div className="relative min-h-[320px] bg-[#d8ddd9]">
                    {listing.image ? (
                      <img src={listing.image} alt={listing.title} className="absolute inset-0 h-full w-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 bg-[#d8ddd9]" />
                    )}
                  </div>
                </div>
              </div>
            </Container>
          </section>

          <Container className="space-y-10 py-12 lg:space-y-12 lg:py-16">
            <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr] xl:items-start">
              <article className="rounded-[2rem] border border-black/6 bg-white/82 p-6 shadow-[0_24px_70px_rgba(11,16,32,0.08)] backdrop-blur-sm md:p-8">
                <div className="h-[2px] w-16 bg-[var(--accent)]" />
                <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#6a7280]">Listing details</p>
                <div className="mt-5 space-y-4 text-sm leading-8 text-[#56606d]">
                  {listing.description.map((paragraph: string) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </article>

              <aside className="space-y-6">
                <section className="rounded-[2rem] border border-white/16 bg-[linear-gradient(180deg,rgba(11,16,32,0.92)_0%,rgba(11,16,32,0.98)_100%)] p-6 text-white shadow-[0_24px_70px_rgba(11,16,32,0.18)]">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--accent)]">Contact</p>
                  <h2 className="mt-3 font-sans text-[2rem] font-semibold leading-[0.98] tracking-[-0.04em] text-white">
                    Interested in this listing?
                  </h2>
                  <p className="mt-4 text-sm leading-8 text-white/72">
                    Send your enquiry through the London News classifieds desk. Reader contact details are captured here and can be reviewed before the seller is contacted.
                  </p>
                  <div className="mt-5">
                    <ClassifiedEnquiryForm slug={listing.slug} title={listing.title} />
                  </div>
                </section>

                <section className="rounded-[2rem] border border-black/6 bg-white/82 p-6 shadow-[0_24px_70px_rgba(11,16,32,0.08)] backdrop-blur-sm">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-[#6a7280]">More from {listing.category}</p>
                  <h2 className="mt-3 font-sans text-[2rem] font-semibold leading-[0.98] tracking-[-0.04em] text-[#1a2433]">
                    Related listings
                  </h2>

                  <div className="mt-5 space-y-4">
                    {relatedListings.length > 0 ? (
                      relatedListings.map((item: ClassifiedCardView) => (
                        <Link
                          key={item.slug}
                          href={`/classifieds/${item.slug}`}
                          className="block rounded-[1.5rem] border border-black/6 bg-[#f8f3eb] px-4 py-4 transition hover:border-black/20 hover:bg-white"
                        >
                          <p className="text-[11px] uppercase tracking-[0.22em] text-[#6a7280]">{item.location}</p>
                          <h3 className="mt-2 text-lg font-semibold text-[#1a2433]">{item.title}</h3>
                          <p className="mt-2 text-sm text-[#56606d]">{item.price}</p>
                        </Link>
                      ))
                    ) : (
                      <p className="text-sm leading-8 text-[#56606d]">
                        More listings from this category will appear here as the classifieds desk grows.
                      </p>
                    )}
                  </div>
                </section>
              </aside>
            </section>
          </Container>
        </main>

        <FooterMark data={homepage} />
      </div>
    </>
  );
}
