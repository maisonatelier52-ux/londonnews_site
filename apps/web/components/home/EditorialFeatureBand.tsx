// app/web/components/home/EditorialFeatureBand.tsx
import Link from "next/link";
import type { HeadlineItem, Story } from "../../lib/homepage-data";

type SideStory = {
  id: string;
  label: string;
  title: string;
  summary: string;
  href: string;
};

export function EditorialFeatureBand({
  lead,
  sideStories
}: {
  lead: Story;
  sideStories: SideStory[];
}) {
  return (
    <section className="bg-black py-14 text-white lg:py-20">
      <div className="mx-auto grid max-w-[1440px] gap-14 px-4 sm:px-8 xl:grid-cols-[1.1fr_0.9fr] xl:items-start xl:gap-20 lg:px-12">
        <article className="max-w-[760px] xl:sticky xl:top-24">
          <div className="mb-8 h-2 w-40 bg-[#2d67f2]" />
          <p className="ln-ui text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">
            {lead.section}
          </p>
          <h2 className="mt-5 font-sans text-[3rem] font-semibold leading-[0.94] tracking-[-0.05em] text-white sm:text-[4rem] lg:text-[5rem]">
            <Link href={lead.href} className="transition hover:text-[var(--accent-soft)]">
              {lead.title}
            </Link>
          </h2>
          <p className="mt-6 max-w-[680px] text-base leading-8 text-white/80 sm:text-lg">{lead.excerpt}</p>
        </article>

        <div className="space-y-10">
          {sideStories.map((story) => (
            <article key={story.id} className="border-b border-white/10 pb-10 last:border-b-0 last:pb-0">
              <p className="ln-ui text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">
                {story.label}
              </p>
              <h3 className="mt-4 font-sans text-[2rem] font-semibold leading-[1] tracking-[-0.04em] text-white sm:text-[2.7rem]">
                <Link href={story.href} className="transition hover:text-[var(--accent-soft)]">
                  {story.title}
                </Link>
              </h3>
              <p className="mt-4 max-w-[520px] text-sm leading-7 text-white/74 sm:text-base">{story.summary}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function mapHeadlineToSideStory(item: HeadlineItem, fallbackLabel = "Briefing"): SideStory {
  return {
    id: item.id,
    label: fallbackLabel,
    title: item.title,
    summary: item.summary,
    href: item.href
  };
}

