import Link from "next/link";
import type { HomepageView, NavItem } from "../../lib/cms-types";
import { SITE_DESCRIPTION, SITE_LANGUAGE } from "../../lib/site";
import { Container } from "./Container";
import { LondonNewsLogo } from "./LondonNewsLogo";
import { NewsletterSignupForm } from "../public/NewsletterSignupForm";

type FooterLink = {
  label: string;
  href: string;
};

function dedupeLinks(links: FooterLink[]) {
  const seen = new Set<string>();
  return links.filter((link) => {
    if (seen.has(link.href)) return false;
    seen.add(link.href);
    return true;
  });
}

function flattenTopicLinks(nav: NavItem[]) {
  return dedupeLinks(
    nav.flatMap((item) =>
      (item.children || []).map((child) => ({
        label: child.label,
        href: child.href
      }))
    )
  );
}

export function FooterMark({ data }: { data: HomepageView }) {
  const year = new Date().getFullYear();
  const deskLinks = dedupeLinks(
    data.nav
      .filter((item) => item.href !== "/" && item.href !== "/sections")
      .map((item) => ({
        label: item.label,
        href: item.href
      }))
  );
  const topicLinks = flattenTopicLinks(data.nav);
  const serviceLinks = dedupeLinks([
    { label: "Browse all desks", href: "/sections" },
    { label: "Search", href: "/search" },
    { label: "Classifieds", href: "/classifieds" },
    { label: "Submit a classified", href: "/classifieds/submit" },
    { label: "Customise", href: "/customise" },
    { label: "Subscribe", href: "/subscribe" }
  ]);
  const newsroomLinks = [
    { label: "About Us", href: "/page/about" },
    { label: "Contact Us", href: "/page/contact" },
    { label: "Editorial Policy", href: "/page/editorial-policy" },
    { label: "Corrections Policy", href: "/page/corrections-policy" },
    { label: "Source Methodology", href: "/page/source-methodology" }
  ];
  const standardsLinks = [
    { label: "Ownership & Funding", href: "/page/ownership-and-funding" },
    { label: "Advertising Policy", href: "/page/advertising-policy" },
    { label: "Right of Reply", href: "/page/right-of-reply" },
    { label: "Terms & Conditions", href: "/page/terms-and-conditions" },
    { label: "Legal Information", href: "/page/legal" },
    { label: "Privacy Policy", href: "/page/privacy-policy" }
  ];
  const quickActionLinks = dedupeLinks([
    ...data.utilityLinks.map((item) => ({ label: item.label, href: item.href })),
    { label: "Contact the newsroom", href: "/page/contact" },
    { label: "Submit a classified", href: "/classifieds/submit" }
  ]).slice(0, 4);
  const footerUtilityLinks = dedupeLinks([
    { label: "Contact", href: "/page/contact" },
    { label: "Privacy", href: "/page/privacy-policy" },
    { label: "Terms", href: "/page/terms-and-conditions" },
    { label: "Corrections", href: "/page/corrections-policy" }
  ]);
  const infoStats = [
    {
      label: "Live desks",
      value: String(deskLinks.length)
    },
    {
      label: "Topic pages",
      value: String(topicLinks.length)
    },
    {
      label: "Reader services",
      value: String(serviceLinks.length)
    }
  ];

  return (
    <footer className="bg-[var(--navy)] py-12 text-white lg:py-16">
      <Container>
        <div className="grid gap-10 border-b border-white/10 pb-12 xl:grid-cols-[1.05fr_1.5fr_0.95fr]">
          <div className="max-w-[360px]">
            <div className="mb-6 h-px w-10 bg-[var(--accent)]" />
            <LondonNewsLogo imageClassName="text-[2.8rem] sm:text-[3.45rem]" ariaLabel="London News home" />
            <p className="mt-5 text-sm leading-7 text-white/68">{SITE_DESCRIPTION}</p>

            <div className="mt-7 grid gap-3 sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
              {infoStats.map((stat) => (
                <article key={stat.label} className="border border-white/10 bg-white/[0.03] px-4 py-4">
                  <p className="ln-ui text-[10px] font-semibold uppercase tracking-[0.18em] text-white/48">
                    {stat.label}
                  </p>
                  <p className="mt-2 text-[1.65rem] font-semibold leading-none text-white">{stat.value}</p>
                </article>
              ))}
            </div>

            <div className="mt-7">
              <p className="ln-ui text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--accent)]">
                Quick actions
              </p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {quickActionLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="border border-white/10 px-4 py-3 ln-ui text-[11px] font-bold uppercase tracking-[0.16em] text-white/82 transition hover:border-[var(--accent)] hover:text-white"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-4">
            <FooterColumn title="Newsroom" links={newsroomLinks} />
            <FooterColumn title="Desks" links={deskLinks.slice(0, 6)} />
            <FooterColumn title="Topics" links={topicLinks.slice(0, 6)} />
            <FooterColumn title="Standards" links={standardsLinks} />
          </div>

          <div className="max-w-[320px] xl:ml-auto">
            <div className="mb-6 h-px w-10 bg-[var(--accent)]" />
            <p className="ln-ui text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--accent)]">
              Digital edition
            </p>
            <h2 className="mt-4 text-[2rem] font-light leading-none tracking-[-0.03em] text-white">
              Stay ahead of London.
            </h2>
            <p className="mt-4 text-sm leading-7 text-white/68">
              Get editor-curated reporting, market briefings, culture picks, and service journalism delivered directly to your inbox.
            </p>
            <div className="mt-6">
              <NewsletterSignupForm source="footer" dark buttonLabel="Subscribe" />
            </div>

            <div className="mt-7 border-t border-white/10 pt-6">
              <p className="ln-ui text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--accent)]">
                Reader services
              </p>
              <div className="mt-4 grid gap-3">
                {serviceLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-sm leading-6 text-white/74 transition hover:text-white"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6 pt-7 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="ln-ui text-[11px] font-medium uppercase tracking-[0.14em] text-white/56">
              © {year} London News. All rights reserved. {SITE_LANGUAGE.toUpperCase()} digital edition.
            </p>
            <p className="mt-3 text-sm leading-7 text-white/48">
              London News covers politics, business, markets, property, culture, technology, and classifieds with a role-based newsroom workflow and live public publishing.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            {footerUtilityLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="ln-ui text-[11px] font-medium uppercase tracking-[0.14em] text-white/60 transition hover:text-white"
              >
                {link.label}
              </Link>
            ))}
            <a
              href="#top"
              className="ln-ui text-[11px] font-medium uppercase tracking-[0.16em] text-white/60 transition hover:text-white"
            >
              Back to top ↑
            </a>
          </div>
        </div>
      </Container>
    </footer>
  );
}

function FooterColumn({
  title,
  links
}: {
  title: string;
  links: FooterLink[];
}) {
  return (
    <div>
      <p className="ln-ui text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--accent)]">{title}</p>
      <div className="mt-5 grid gap-3">
        {links.map((link) => (
          <Link key={link.href} href={link.href} className="text-sm leading-6 text-white/74 transition hover:text-white">
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
