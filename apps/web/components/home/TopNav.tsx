import Link from "next/link";
import { useState } from "react";
import type { HomepageView } from "../../lib/cms-types";
import { Container } from "./Container";
import { LondonNewsLogo } from "./LondonNewsLogo";

function buildPrimaryItems(data: HomepageView) {
  const primary = [{ label: "Home", href: "/" }];

  for (const item of data.nav) {
    if (item.href === "/sections" || item.href === "/") continue;
    primary.push({ label: item.label, href: item.href });
  }

  return primary;
}

export function TopNav({ data }: { data: HomepageView }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const primaryItems = buildPrimaryItems(data);
  const topicGroups = data.nav
    .filter((item) => item.children && item.children.length > 0)
    .map((item) => ({
      label: item.label,
      items: item.children || []
    }));
  const utilityLabel =
    data.utilityLinks.length >= 2
      ? `${data.utilityLinks[0].label} / ${data.utilityLinks[1].label}`
      : data.utilityLinks[0]?.label || "Subscribe";

  return (
    <>
      <header className="relative z-40 hidden border-b border-black/5 bg-[rgba(245,241,232,0.74)] backdrop-blur-sm lg:block">
        <Container className="flex items-center justify-between py-5">
          <nav className="flex flex-1 items-center justify-center gap-8" aria-label="Main navigation">
            {primaryItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="ln-ui text-[11px] font-bold uppercase tracking-[0.16em] text-[#2a3a4a] transition-opacity hover:opacity-65"
              >
                {item.label}
              </Link>
            ))}
            <div className="relative">
              <button
                type="button"
                aria-expanded={moreOpen}
                onClick={() => setMoreOpen((current) => !current)}
                className="ln-ui text-[11px] font-bold uppercase tracking-[0.16em] text-[#2a3a4a] transition-opacity hover:opacity-65"
              >
                More
              </button>

              {moreOpen ? (
                <div className="absolute right-0 top-full mt-4 w-[360px] border border-black/10 bg-white p-5 shadow-2xl">
                  <div className="space-y-5">
                    {topicGroups.map((group) => (
                      <div key={group.label}>
                        <p className="ln-ui text-[11px] font-bold uppercase tracking-[0.18em] text-[#2a3a4a]">
                          {group.label}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {group.items.map((item) => (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={() => setMoreOpen(false)}
                              className="border border-black/10 px-3 py-2 ln-ui text-[10px] font-semibold uppercase tracking-[0.16em] text-[#4f5d70] transition hover:border-black hover:text-black"
                            >
                              {item.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}

                    <div className="border-t border-black/8 pt-5">
                      <Link
                        href="/sections"
                        onClick={() => setMoreOpen(false)}
                        className="ln-ui text-[11px] font-bold uppercase tracking-[0.16em] text-[#2a3a4a] transition-opacity hover:opacity-65"
                      >
                        Browse all desks
                      </Link>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </nav>

          <Link
            href="/customise"
            className="ln-ui shrink-0 text-[11px] font-bold uppercase tracking-[0.16em] text-[#2a3a4a] transition-opacity hover:opacity-65"
          >
            {utilityLabel}
          </Link>
        </Container>
      </header>

      <header className="sticky top-0 z-50 border-b border-black/5 bg-white lg:hidden">
        <Container className="flex h-[76px] items-center justify-between py-0">
          <LondonNewsLogo
            imageClassName="text-[1.45rem] sm:text-[1.65rem]"
            ariaLabel="London News home"
          />

          <div className="flex items-center gap-6">
            <Link href="/search" aria-label="Search" className="flex h-6 w-6 items-center justify-center">
              <span className="text-xl text-[#1b2435]">⌕</span>
            </Link>
            <button
              type="button"
              aria-label="Open menu"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((current) => !current)}
              className="flex h-[22px] w-[22px] flex-col items-center justify-center gap-[5px]"
            >
              <span className={`block h-[2px] w-[22px] bg-[#1b2435] transition-all ${mobileOpen ? "translate-y-[7px] rotate-45" : ""}`} />
              <span className={`block h-[2px] w-[18px] bg-[#1b2435] transition-all ${mobileOpen ? "opacity-0" : "opacity-100"}`} />
              <span className={`block h-[2px] w-[22px] bg-[#1b2435] transition-all ${mobileOpen ? "-translate-y-[7px] -rotate-45" : ""}`} />
            </button>
          </div>
        </Container>
      </header>

      <div
        aria-hidden="true"
        onClick={() => setMobileOpen(false)}
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 lg:hidden ${
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-[300px] flex-col bg-white transition-transform duration-300 ease-out lg:hidden ${
          mobileOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-black/10 px-5 py-5">
          <span className="ln-ui text-[12px] font-bold uppercase tracking-[0.18em] text-[#2a3a4a]">Browse</span>
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
            className="flex h-8 w-8 items-center justify-center text-black/40 transition-colors hover:text-black"
          >
            ×
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-3" aria-label="Mobile navigation">
          {primaryItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className="block border-b border-black/5 px-5 py-3.5 ln-ui text-[12px] font-bold uppercase tracking-[0.14em] text-[#2a3a4a] no-underline transition-colors hover:bg-black/5"
            >
              {item.label}
            </Link>
          ))}

          {topicGroups.map((group) => (
            <div key={group.label} className="border-b border-black/5 px-5 py-5">
              <p className="ln-ui text-[11px] font-bold uppercase tracking-[0.18em] text-[#7c8797]">{group.label}</p>
              <div className="mt-4 grid gap-2">
                {group.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="ln-ui text-[12px] font-semibold uppercase tracking-[0.12em] text-[#2a3a4a]"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}

          <Link
            href="/sections"
            onClick={() => setMobileOpen(false)}
            className="block border-b border-black/5 px-5 py-3.5 ln-ui text-[12px] font-bold uppercase tracking-[0.14em] text-[#2a3a4a] no-underline transition-colors hover:bg-black/5"
          >
            All desks
          </Link>
        </nav>

        <div className="space-y-3 border-t border-black/10 px-5 py-5">
          {data.utilityLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className="block bg-[var(--accent)] px-5 py-3 text-center ln-ui text-[11px] font-bold uppercase tracking-[0.16em] text-black transition-colors hover:bg-[#ebbb32]"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </aside>
    </>
  );
}
