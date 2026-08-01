// apps/web/components/editorial/ArticleSidebar.tsx
import Link from "next/link";
import { EventItem, StoryCardData } from "../../lib/editorial-data";
import { SocialShareRail } from "../home/SocialShareRail";

export function ArticleSidebar({
  mostRead,
  events
}: {
  mostRead: StoryCardData[];
  events: EventItem[];
}) {
  return (
    <aside className="space-y-6">
      <section className="rounded-[2rem] border border-black/6 bg-white/82 p-6 shadow-[0_18px_44px_rgba(17,24,39,0.08)] backdrop-blur-sm">
        <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Share this story</p>
        <div className="mt-4">
          <SocialShareRail />
        </div>
      </section>

      <section className="overflow-hidden rounded-[2rem] bg-[linear-gradient(180deg,rgba(11,16,32,0.95)_0%,rgba(11,16,32,1)_100%)] p-6 text-white shadow-[0_26px_70px_rgba(11,16,32,0.22)]">
        <p className="ln-ui text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">Most read</p>
        <div className="mt-5 space-y-5">
          {mostRead.map((story, index) => (
            <article key={story.id} className="border-b border-white/10 pb-5 last:border-b-0 last:pb-0">
              <div className="mb-2 text-[11px] uppercase tracking-[0.22em] text-white/44">
                {String(index + 1).padStart(2, "0")}
              </div>
              <h3 className="font-sans text-[1.5rem] font-semibold leading-[1.02] tracking-[-0.03em] text-white">
                <Link href={story.href} className="transition hover:text-[var(--accent-soft)]">
                  {story.title}
                </Link>
              </h3>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-[2rem] border border-black/6 bg-white/82 p-6 shadow-[0_18px_44px_rgba(17,24,39,0.08)] backdrop-blur-sm">
        <p className="ln-ui text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">Newsletter</p>
        <h3 className="mt-3 font-sans text-[2rem] font-semibold leading-[0.98] tracking-[-0.04em] text-[#172131]">
          Get the best of London in your inbox
        </h3>
        <p className="mt-3 text-sm leading-7 text-zinc-700">
          Join the city briefing for premium reads, culture picks, market updates, and what matters next.
        </p>
        <Link
          href="/subscribe"
          className="mt-5 inline-flex items-center border-b border-zinc-900 pb-1 text-xs font-semibold uppercase tracking-[0.22em] text-zinc-950 transition hover:text-[#7b5a00]"
        >
          Subscribe
        </Link>
      </section>

      <section className="rounded-[2rem] border border-black/6 bg-white/82 p-6 shadow-[0_18px_44px_rgba(17,24,39,0.08)] backdrop-blur-sm">
        <p className="ln-ui text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">Events in your area</p>
        <div className="mt-4 space-y-4">
          {events.map((event) => (
            <div key={`${event.category}-${event.title}`} className="rounded-[1.5rem] border border-black/8 bg-stone-50 px-4 py-4">
              <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">{event.category}</p>
              <h3 className="mt-2 text-base font-semibold text-zinc-950">{event.title}</h3>
              <p className="mt-1 text-sm text-zinc-600">{event.time}</p>
            </div>
          ))}
        </div>
      </section>
    </aside>
  );
}
