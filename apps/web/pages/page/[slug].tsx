import type { GetStaticPaths, GetStaticProps, InferGetStaticPropsType } from "next";
import Link from "next/link";
import { Container } from "../../components/home/Container";
import { ContactMessageForm } from "../../components/public/ContactMessageForm";
import { PublicPageShell } from "../../components/public/PublicPageShell";
import { SeoHead } from "../../components/seo/SeoHead";
import { StructuredData } from "../../components/seo/StructuredData";
import { getActiveHomepageData } from "../../lib/cms/queries/homepage";
import { absoluteUrl } from "../../lib/cms/utils";
import type { PublicPageContent } from "../../lib/public-pages";
import { getPublicPage, publicPages } from "../../lib/public-pages";
import { getPublisherProfile } from "../../lib/publisher";
import { buildCollectionPageStructuredData, buildSeo } from "../../lib/seo";

export const getStaticPaths: GetStaticPaths = async () => {
  return {
    paths: publicPages.map((page) => ({ params: { slug: page.slug } })),
    fallback: false
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slug = typeof params?.slug === "string" ? params.slug : "";
  const [homepage, page] = await Promise.all([getActiveHomepageData(), Promise.resolve(getPublicPage(slug))]);

  if (!homepage || !page) {
    return {
      notFound: true,
      revalidate: 60
    };
  }

  return {
    props: JSON.parse(
      JSON.stringify({
        homepage,
        page
      })
    ),
    revalidate: 60
  };
};

export default function PublicContentPage({
  homepage,
  page
}: InferGetStaticPropsType<typeof getStaticProps>) {
  const publisher = getPublisherProfile();
  const seo = buildSeo({
    title: `${page.title} | London News`,
    description: page.description,
    canonical: absoluteUrl(`/page/${page.slug}`),
    keywords: page.keywords
  });

  return (
    <>
      <SeoHead {...seo} />
      <StructuredData
        id={`public-page-${page.slug}`}
        data={buildCollectionPageStructuredData({
          url: seo.canonical,
          name: page.title,
          description: page.description,
          breadcrumbs: [
            { name: "Home", item: absoluteUrl("/") },
            { name: page.title, item: seo.canonical }
          ]
        })}
      />

      <PublicPageShell
        homepage={homepage}
        eyebrow={page.eyebrow}
        title={page.title}
        description={page.description}
        actions={
          <>
            <Link
              href="/subscribe"
              className="bg-[var(--accent)] px-5 py-3 text-center ln-ui text-[11px] font-bold uppercase tracking-[0.16em] text-black transition hover:bg-[#ebbb32]"
            >
              Subscribe
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
        <Container>
          <div className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-6">
              {page.sections.map((section: PublicPageContent["sections"][number]) => (
                <section key={section.heading} className="border border-black/8 bg-white/70 p-7 backdrop-blur-sm lg:p-8">
                  <h2 className="font-sans text-[2rem] font-semibold leading-[1] tracking-[-0.03em] text-[#1a2433] sm:text-[2.4rem]">
                    {section.heading}
                  </h2>
                  <div className="mt-5 space-y-4 text-sm leading-8 text-[#4e5867] sm:text-base">
                    {section.paragraphs.map((paragraph: string) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>
                  {section.bullets?.length ? (
                    <ul className="mt-6 grid gap-3 text-sm leading-7 text-[#263243] sm:text-base">
                      {section.bullets.map((bullet: string) => (
                        <li key={bullet} className="border-l-2 border-[var(--accent)] pl-4">
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </section>
              ))}

              {page.slug === "contact" ? (
                <section className="border border-black/8 bg-white/70 p-7 backdrop-blur-sm lg:p-8">
                  <h2 className="font-sans text-[2rem] font-semibold leading-[1] tracking-[-0.03em] text-[#1a2433] sm:text-[2.4rem]">
                    Send a message
                  </h2>
                  <p className="mt-5 text-sm leading-8 text-[#4e5867] sm:text-base">
                    Use this form for editorial queries, correction requests, commercial approaches, and support questions.
                  </p>
                  <div className="mt-6">
                    <ContactMessageForm />
                  </div>
                </section>
              ) : null}
            </div>

            <aside className="space-y-6">
              <section className="border border-black/8 bg-[var(--navy)] p-7 text-white lg:p-8">
                <div className="h-px w-10 bg-[var(--accent)]" />
                <p className="mt-6 ln-ui text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">
                  Publication note
                </p>
                <p className="mt-4 text-sm leading-8 text-white/74">
                  {page.updatedLabel}. These pages are part of the live London News public-information layer and should be reviewed with final publisher details before launch.
                </p>
              </section>

              {page.slug === "contact" ? (
                <section className="border border-black/8 bg-white/70 p-7 backdrop-blur-sm lg:p-8">
                  <p className="ln-ui text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6a7280]">
                    Publisher contacts
                  </p>
                  <div className="mt-5 space-y-3 text-sm leading-7 text-[#4e5867]">
                    <p><strong className="text-[#1f2b3b]">{publisher.name}</strong></p>
                    <p>{publisher.address}</p>
                    <p>
                      Editorial: <a href={`mailto:${publisher.editorialEmail}`} className="font-semibold text-[#1f2b3b]">{publisher.editorialEmail}</a>
                    </p>
                    <p>
                      Memberships: <a href={`mailto:${publisher.membershipsEmail}`} className="font-semibold text-[#1f2b3b]">{publisher.membershipsEmail}</a>
                    </p>
                    <p>
                      Classifieds: <a href={`mailto:${publisher.classifiedsEmail}`} className="font-semibold text-[#1f2b3b]">{publisher.classifiedsEmail}</a>
                    </p>
                    <p>{publisher.phone}</p>
                  </div>
                </section>
              ) : null}

              <section className="border border-black/8 bg-white/70 p-7 backdrop-blur-sm lg:p-8">
                <p className="ln-ui text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6a7280]">
                  Related routes
                </p>
                <div className="mt-5 grid gap-3">
                  <Link href="/subscribe" className="text-base font-semibold text-[#1f2b3b] transition hover:opacity-65">
                    Subscribe
                  </Link>
                  <Link href="/customise" className="text-base font-semibold text-[#1f2b3b] transition hover:opacity-65">
                    Customise your news
                  </Link>
                  <Link href="/sections" className="text-base font-semibold text-[#1f2b3b] transition hover:opacity-65">
                    Browse desks and topics
                  </Link>
                  <Link href="/classifieds" className="text-base font-semibold text-[#1f2b3b] transition hover:opacity-65">
                    Explore classifieds
                  </Link>
                </div>
              </section>
            </aside>
          </div>
        </Container>
      </PublicPageShell>
    </>
  );
}
