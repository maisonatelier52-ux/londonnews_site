import Link from "next/link";
import type { HomepageView } from "../../lib/cms-types";

export function CommunityServiceBlock({ data }: { data: HomepageView }) {
  return (
    <section className="bg-[#e7ded0] py-12 text-zinc-950 lg:py-16">
      <div className="mx-auto grid max-w-[1440px] gap-8 px-4 sm:px-8 xl:grid-cols-[1.02fr_0.98fr_0.9fr] lg:px-12">
        <div className="bg-[var(--navy)] px-6 py-8 text-white lg:px-8 lg:py-10">
          <div className="h-px w-10 bg-[var(--accent)]" />
          <p className="mt-6 ln-ui text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">
            {data.socialCalendarTitle}
          </p>
          <h2 className="mt-4 font-sans text-[2.4rem] font-semibold leading-[0.96] tracking-[-0.04em] text-white">
            {data.subscribeTitle}
          </h2>
          <p className="mt-5 max-w-[460px] text-sm leading-8 text-white/74">{data.subscribeBody}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/subscribe"
              className="bg-[var(--accent)] px-5 py-3 text-center ln-ui text-[11px] font-bold uppercase tracking-[0.16em] text-black transition hover:bg-[#ebbb32]"
            >
              Subscribe now
            </Link>
            <Link
              href="/customise"
              className="border border-white/16 px-5 py-3 text-center ln-ui text-[11px] font-bold uppercase tracking-[0.16em] text-white transition hover:border-white hover:text-white"
            >
              Customise
            </Link>
          </div>
        </div>

        <div className="border border-black/8 bg-white/70 px-6 py-8 backdrop-blur-sm lg:px-8 lg:py-10">
          <div className="flex items-center justify-between gap-4 border-b border-black/8 pb-4">
            <p className="ln-ui text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6a7280]">
              {data.eventsAreaLabel}
            </p>
            <span className="ln-ui text-[11px] uppercase tracking-[0.18em] text-[#8c939d]">Across London</span>
          </div>

          <div className="mt-5 space-y-4">
            {data.events.map((event) => (
              <div key={`${event.category}-${event.title}`} className="border-b border-black/8 pb-4 last:border-b-0 last:pb-0">
                <p className="ln-ui text-[10px] font-semibold uppercase tracking-[0.18em] text-[#7e8794]">
                  {event.category}
                </p>
                <h3 className="mt-2 text-xl font-semibold leading-tight text-zinc-950">{event.title}</h3>
                <p className="mt-2 text-sm text-zinc-600">{event.time}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="border border-black/8 bg-white/70 px-6 py-8 backdrop-blur-sm lg:px-8 lg:py-10">
          <div className="flex items-center justify-between gap-4 border-b border-black/8 pb-4">
            <p className="ln-ui text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6a7280]">Classifieds</p>
            <Link
              href="/classifieds"
              className="ln-ui text-[11px] font-semibold uppercase tracking-[0.18em] text-[#2b3546] transition hover:opacity-65"
            >
              View all
            </Link>
          </div>

          <div className="mt-5 space-y-4">
            {data.classifieds.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block border-b border-black/8 pb-4 transition hover:opacity-70 last:border-b-0 last:pb-0"
              >
                <p className="ln-ui text-[10px] font-semibold uppercase tracking-[0.18em] text-[#7e8794]">
                  {item.category}
                </p>
                <h3 className="mt-2 text-xl font-semibold leading-tight text-zinc-950">{item.title}</h3>
              </Link>
            ))}
          </div>

          <Link
            href="/classifieds/submit"
            className="mt-7 inline-flex bg-[var(--accent)] px-5 py-3 text-center ln-ui text-[11px] font-bold uppercase tracking-[0.16em] text-black transition hover:bg-[#ebbb32]"
          >
            Submit a listing
          </Link>
        </div>
      </div>
    </section>
  );
}
