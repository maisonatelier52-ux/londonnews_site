import type { GetStaticProps, InferGetStaticPropsType } from "next";
import Link from "next/link";
import { Container } from "../components/home/Container";
import { PublicPageShell } from "../components/public/PublicPageShell";
import { SeoHead } from "../components/seo/SeoHead";
import { StructuredData } from "../components/seo/StructuredData";
import { getActiveHomepageData } from "../lib/cms/queries/homepage";
import { absoluteUrl } from "../lib/cms/utils";
import { buildCollectionPageStructuredData, buildSeo } from "../lib/seo";

export const getStaticProps: GetStaticProps = async () => {
  const homepage = await getActiveHomepageData();

  if (!homepage) {
    return {
      notFound: true,
      revalidate: 60
    };
  }

  return {
    props: JSON.parse(JSON.stringify({ homepage })),
    revalidate: 60
  };
};

export default function CustomisePage({
  homepage
}: InferGetStaticPropsType<typeof getStaticProps>) {
  const seo = buildSeo({
    title: "Customise Your London News",
    description:
      "Set the desks, briefings, and London alerts you want London News to prioritise.",
    canonical: absoluteUrl("/customise"),
    keywords: ["customise london news", "news alerts", "desk preferences"]
  });

  const desks = homepage.nav
    .filter((item: any) => item.href !== "/" && item.href !== "/sections")
    .slice(0, 6);

  return (
    <>
      <SeoHead {...seo} />
      <StructuredData
        id="customise-structured-data"
        data={buildCollectionPageStructuredData({
          url: seo.canonical,
          name: "Customise Your London News",
          description: seo.description,
          breadcrumbs: [
            { name: "Home", item: absoluteUrl("/") },
            { name: "Customise", item: seo.canonical }
          ]
        })}
      />

      <PublicPageShell
        homepage={homepage}
        eyebrow="Reader Experience"
        title="Customise the London briefing around your priorities."
        description="Choose the desks, topics, and marketplaces that should surface first in your London News experience."
        actions={
          <>
            <Link
              href="/subscribe"
              className="bg-[var(--accent)] px-5 py-3 text-center ln-ui text-[11px] font-bold uppercase tracking-[0.16em] text-black transition hover:bg-[#ebbb32]"
            >
              Start membership
            </Link>
            <Link
              href="/sections"
              className="border border-black/10 bg-white/55 px-5 py-3 text-center ln-ui text-[11px] font-bold uppercase tracking-[0.16em] text-[#243144] transition hover:border-black hover:text-black"
            >
              Browse desks
            </Link>
          </>
        }
      >
        <Container className="space-y-8">
          <section className="grid gap-6 xl:grid-cols-3">
            <article className="bg-[var(--navy)] p-7 text-white lg:p-8">
              <p className="ln-ui text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">
                Priority desks
              </p>
              <h2 className="mt-4 font-sans text-[2rem] font-semibold leading-[1] tracking-[-0.03em]">
                Lead with the subjects you actually follow.
              </h2>
              <p className="mt-5 text-sm leading-8 text-white/74">
                Pin politics, business, culture, or classifieds signals to the top of your reading flow and homepage alerts.
              </p>
            </article>

            <article className="border border-black/8 bg-white/70 p-7 backdrop-blur-sm lg:p-8">
              <p className="ln-ui text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6a7280]">
                Briefings
              </p>
              <h2 className="mt-4 font-sans text-[2rem] font-semibold leading-[1] tracking-[-0.03em] text-[#1a2433]">
                Morning, midday, and weekend editions.
              </h2>
              <p className="mt-5 text-sm leading-8 text-[#56606d]">
                Readers can tune how often London News surfaces updates, whether the focus is market movement, Westminster, culture, or local buying and selling.
              </p>
            </article>

            <article className="border border-black/8 bg-white/70 p-7 backdrop-blur-sm lg:p-8">
              <p className="ln-ui text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6a7280]">
                Alerts
              </p>
              <h2 className="mt-4 font-sans text-[2rem] font-semibold leading-[1] tracking-[-0.03em] text-[#1a2433]">
                Get notified when London moves.
              </h2>
              <p className="mt-5 text-sm leading-8 text-[#56606d]">
                Weather disruptions, elections, transport, property, and culture can all be elevated into the reader’s preferred signal set.
              </p>
            </article>
          </section>

          <section className="border border-black/8 bg-white/70 p-7 backdrop-blur-sm lg:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="ln-ui text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6a7280]">
                  Desk shortcuts
                </p>
                <h2 className="mt-4 font-sans text-[2.3rem] font-semibold leading-[0.98] tracking-[-0.04em] text-[#1a2433]">
                  Start with the desks London readers revisit most.
                </h2>
              </div>
              <Link
                href="/search"
                className="ln-ui text-[11px] font-bold uppercase tracking-[0.16em] text-[#1f2b3b] transition hover:opacity-65"
              >
                Search routes
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              {desks.map((item: any) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="border border-black/10 bg-[#f5efe3] px-4 py-3 ln-ui text-[11px] font-bold uppercase tracking-[0.16em] text-[#263243] transition hover:border-black hover:bg-white"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </section>
        </Container>
      </PublicPageShell>
    </>
  );
}
