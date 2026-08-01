import type { GetStaticProps, InferGetStaticPropsType } from "next";
import { Container } from "../components/home/Container";
import { NewsletterSignupForm } from "../components/public/NewsletterSignupForm";
import { PublicPageShell } from "../components/public/PublicPageShell";
import { SeoHead } from "../components/seo/SeoHead";
import { StructuredData } from "../components/seo/StructuredData";
import { getActiveHomepageData } from "../lib/cms/queries/homepage";
import { absoluteUrl } from "../lib/cms/utils";
import { buildCollectionPageStructuredData, buildSeo } from "../lib/seo";

const plans = [
  {
    name: "Standard",
    price: "£6",
    cadence: "per month",
    summary: "Daily access to editor-curated London coverage and member briefings."
  },
  {
    name: "Weekend",
    price: "£9",
    cadence: "per month",
    summary: "Includes the Standard plan plus long-read culture, property, and city roundups."
  },
  {
    name: "Corporate",
    price: "Custom",
    cadence: "team pricing",
    summary: "For desks, agencies, and organisations that need shared access and briefings."
  }
];

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

export default function SubscribePage({
  homepage
}: InferGetStaticPropsType<typeof getStaticProps>) {
  const seo = buildSeo({
    title: "Subscribe to London News",
    description:
      "Join London News for editor-curated reporting, premium briefings, and a faster route into the capital’s most important stories.",
    canonical: absoluteUrl("/subscribe"),
    keywords: ["subscribe london news", "news membership", "london subscriptions"]
  });

  return (
    <>
      <SeoHead {...seo} />
      <StructuredData
        id="subscribe-structured-data"
        data={buildCollectionPageStructuredData({
          url: seo.canonical,
          name: "Subscribe to London News",
          description: seo.description,
          breadcrumbs: [
            { name: "Home", item: absoluteUrl("/") },
            { name: "Subscribe", item: seo.canonical }
          ]
        })}
      />

      <PublicPageShell
        homepage={homepage}
        eyebrow="Membership"
        title="Subscribe for a sharper view of London."
        description="Premium reads, curated briefings, and the fastest route into the politics, markets, culture, and classifieds shaping the city."
      >
        <Container className="space-y-8">
          <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <article className="bg-[var(--navy)] p-7 text-white lg:p-8">
              <p className="ln-ui text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">
                Member access
              </p>
              <h2 className="mt-4 font-sans text-[2.5rem] font-semibold leading-[0.96] tracking-[-0.04em]">
                {homepage.subscribeTitle}
              </h2>
              <p className="mt-5 max-w-[560px] text-sm leading-8 text-white/74">{homepage.subscribeBody}</p>
              <div className="mt-8 sm:max-w-[420px]">
                <NewsletterSignupForm source="subscribe-page" buttonLabel="Join the list" dark />
              </div>
            </article>

            <div className="grid gap-6">
              {plans.map((plan) => (
                <article key={plan.name} className="border border-black/8 bg-white/70 p-7 backdrop-blur-sm lg:p-8">
                  <div className="flex items-start justify-between gap-6">
                    <div>
                      <p className="ln-ui text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6a7280]">
                        {plan.name}
                      </p>
                      <h2 className="mt-3 font-sans text-[2.1rem] font-semibold leading-[1] tracking-[-0.03em] text-[#1a2433]">
                        {plan.price}
                      </h2>
                      <p className="mt-1 text-sm text-[#7d8694]">{plan.cadence}</p>
                    </div>
                  </div>
                  <p className="mt-5 text-sm leading-8 text-[#56606d]">{plan.summary}</p>
                </article>
              ))}
            </div>
          </section>
        </Container>
      </PublicPageShell>
    </>
  );
}
