import type { StoryCardData } from "../../lib/cms-types";
import { StoryCard } from "../home/StoryCard";

export function CategoryHero({
  name,
  description,
  leadStory,
  eyebrow = "Category",
  stats = []
}: {
  name: string;
  description: string;
  leadStory: StoryCardData | null;
  eyebrow?: string;
  stats?: string[];
}) {
  return (
    <section className="overflow-hidden rounded-[2.3rem] border border-black/6 shadow-[0_28px_72px_rgba(17,24,39,0.08)]">
      <div className="grid xl:grid-cols-[minmax(0,0.94fr)_minmax(320px,1.06fr)]">
        <div className="ln-hero-surface border-b border-black/5 p-6 md:p-8 xl:border-b-0 xl:border-r">
          <div className="h-[2px] w-20 bg-[var(--accent)]" />
          <p className="mt-7 text-[11px] uppercase tracking-[0.24em] text-zinc-600">{eyebrow}</p>
          <h1 className="mt-4 font-sans text-[3rem] font-semibold leading-[0.92] tracking-[-0.05em] text-[#172131] sm:text-[4rem] lg:text-[5rem]">
            {name}
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-zinc-700">{description}</p>
          {stats.length > 0 ? (
            <div className="mt-7 flex flex-wrap gap-3">
              {stats.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-black/10 bg-white/70 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-700 backdrop-blur-sm"
                >
                  {item}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <div className="bg-[linear-gradient(180deg,rgba(11,16,32,0.94)_0%,rgba(11,16,32,1)_100%)] p-4 md:p-6">
          {leadStory ? (
            <StoryCard story={leadStory} large />
          ) : (
            <div className="flex min-h-[420px] items-end rounded-[2rem] border border-white/12 bg-white/[0.05] p-6 text-white/76 backdrop-blur-sm">
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--accent)]">Desk status</p>
                <h2 className="mt-4 font-sans text-[2rem] font-semibold tracking-[-0.04em] text-white">
                  This desk is live in the taxonomy.
                </h2>
                <p className="mt-4 max-w-md text-sm leading-7 text-white/68">
                  The section framework is ready. Once approved stories are published, this lead slot will populate automatically with the strongest coverage from the desk.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
