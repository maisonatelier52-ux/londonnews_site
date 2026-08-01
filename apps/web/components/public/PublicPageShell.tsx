import Link from "next/link";
import type { ReactNode } from "react";
import type { HomepageView } from "../../lib/cms-types";
import { Container } from "../home/Container";
import { FooterMark } from "../home/FooterMark";
import { LondonNewsLogo } from "../home/LondonNewsLogo";
import { TopNav } from "../home/TopNav";

export function PublicPageShell({
  homepage,
  eyebrow,
  title,
  description,
  actions,
  children
}: {
  homepage: HomepageView;
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const heroDeskLinks = homepage.nav.filter((item) => item.href !== "/" && item.href !== "/sections").slice(0, 5);
  const frontPageLinks = homepage.topHeadlines.slice(0, 3);

  return (
    <div
      id="top"
      className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.42),transparent_24%),linear-gradient(180deg,#f3efe8_0%,#efe8dd_100%)] text-zinc-950"
    >
      <TopNav data={homepage} />

      <section className="ln-hero-surface border-b border-black/5">
        <Container className="py-12 lg:py-16">
          <div className="grid gap-8 xl:grid-cols-[minmax(0,1.08fr)_360px] xl:items-end">
            <div className="max-w-[980px]">
              <div className="h-[2px] w-24 bg-[var(--accent)]" />
              <p className="mt-7 ln-ui text-[11px] font-semibold uppercase tracking-[0.24em] text-[#5b6776]">
                {eyebrow}
              </p>
              <div className="mt-6">
                <LondonNewsLogo imageClassName="text-[2.15rem] sm:text-[2.7rem]" ariaLabel="London News home" />
              </div>
              <h1 className="mt-7 max-w-[940px] font-sans text-[3rem] font-semibold leading-[0.92] tracking-[-0.05em] text-[#1a2433] sm:text-[4rem] lg:text-[5.3rem]">
                {title}
              </h1>
              <p className="mt-6 max-w-[780px] text-base leading-8 text-[#56606d] sm:text-lg">{description}</p>

              {actions ? <div className="mt-8 flex flex-wrap gap-3">{actions}</div> : null}

              {heroDeskLinks.length > 0 ? (
                <div className="mt-8 flex flex-wrap gap-3">
                  {heroDeskLinks.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="rounded-full border border-black/10 bg-white/60 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#324255] backdrop-blur-sm transition hover:border-black/30 hover:bg-white"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>

            <aside className="xl:justify-self-end">
              <div className="overflow-hidden rounded-[2rem] border border-white/20 bg-[linear-gradient(180deg,rgba(11,16,32,0.92)_0%,rgba(11,16,32,0.98)_100%)] p-6 text-white shadow-[0_30px_80px_rgba(11,16,32,0.28)] backdrop-blur">
                <p className="ln-ui text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">
                  Front page now
                </p>
                <div className="mt-5 space-y-5">
                  {frontPageLinks.map((item, index) => (
                    <article key={item.id} className="border-b border-white/10 pb-5 last:border-b-0 last:pb-0">
                      <div className="text-[11px] uppercase tracking-[0.2em] text-white/44">
                        {String(index + 1).padStart(2, "0")}
                      </div>
                      <h2 className="mt-3 font-sans text-[1.35rem] font-semibold leading-[1.04] tracking-[-0.03em] text-white">
                        <Link href={item.href} className="transition hover:text-[var(--accent-soft)]">
                          {item.title}
                        </Link>
                      </h2>
                      <p className="mt-3 text-sm leading-7 text-white/68">{item.summary}</p>
                    </article>
                  ))}
                </div>

                {homepage.utilityLinks.length > 0 ? (
                  <div className="mt-6 border-t border-white/10 pt-5">
                    <p className="ln-ui text-[10px] font-semibold uppercase tracking-[0.2em] text-white/44">
                      Reader routes
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {homepage.utilityLinks.slice(0, 3).map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="border border-white/14 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/78 transition hover:border-[var(--accent)] hover:text-white"
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </aside>
          </div>
        </Container>
      </section>

      <main className="py-12 lg:py-16">{children}</main>
      <FooterMark data={homepage} />
    </div>
  );
}
