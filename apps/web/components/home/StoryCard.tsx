// apps/web/components/home/StoryCard.tsx
import Link from "next/link";
import { Story } from "../../lib/homepage-data";
import { SocialShareRail } from "./SocialShareRail";

export function StoryCard({
  story,
  large = false,
  dark = false
}: {
  story: Story;
  large?: boolean;
  /**
   * Use when the card is rendered on a dark surface (e.g. the "Related
   * stories" panel on the article page), so title/description/read-more
   * text stays legible instead of dark-on-dark.
   */
  dark?: boolean;
}) {
  if (large) {
    return (
      <article className="group relative min-h-[520px] overflow-hidden rounded-[2rem] bg-[var(--navy)] text-white shadow-[0_28px_80px_rgba(11,16,32,0.26)]">
        <div className="absolute inset-0 bg-cover bg-center transition duration-700 group-hover:scale-[1.03]" style={{ backgroundImage: `url(${story.image || "https://london-news-two.vercel.app/images/homepageimages/sky_bg_image2.webp"})` }} />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(11,16,32,0.12)_0%,rgba(11,16,32,0.38)_42%,rgba(11,16,32,0.88)_100%)]" />

        <div className="relative z-10 flex h-full flex-col justify-between p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="ln-ui text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">
                {story.kicker || story.section}
              </p>
              <p className="mt-3 text-[11px] uppercase tracking-[0.22em] text-white/46">{story.section}</p>
            </div>
            <SocialShareRail light url={story.href} title={story.title} />
          </div>

          <div className="max-w-[560px]">
            <h3 className="font-sans text-[2.35rem] font-semibold leading-[0.95] tracking-[-0.04em] text-white sm:text-[3rem]">
              <Link href={story.href} className="transition hover:text-[var(--accent-soft)]">
                {story.title}
              </Link>
            </h3>
            <p className="mt-5 text-base leading-8 text-white/78">{story.excerpt}</p>
            <Link
              href={story.href}
              className="mt-6 inline-flex items-center border-b border-white/45 pb-1 ln-ui text-[12px] font-bold uppercase tracking-[0.16em] text-white transition hover:text-[var(--accent-soft)]"
            >
              {story.readLabel || "Read more"}
            </Link>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article
      className={
        dark
          ? "h-full overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] shadow-[0_18px_44px_rgba(0,0,0,0.24)] backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:border-white/20"
          : "h-full overflow-hidden rounded-[2rem] border border-black/6 bg-white/82 shadow-[0_18px_44px_rgba(17,24,39,0.08)] backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:shadow-[0_26px_56px_rgba(17,24,39,0.12)]"
      }
    >
      <div className="relative min-h-[240px] overflow-hidden">
        {story.image ? (
          <img src={story.image} alt={story.title} className="absolute inset-0 h-full w-full object-cover transition duration-700 hover:scale-[1.03]" />
        ) : (
          <div className="absolute inset-0 bg-[linear-gradient(135deg,#d8d0c5_0%,#f3efe8_100%)]" />
        )}
      </div>

      <div className="space-y-5 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="ln-ui text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">
              {story.kicker || story.section}
            </p>
            <p className={`mt-2 text-[11px] uppercase tracking-[0.22em] ${dark ? "text-white/50" : "text-zinc-500"}`}>
              {story.section}
            </p>
          </div>
          <SocialShareRail light={dark} url={story.href} title={story.title} />
        </div>

        <div>
          <h3
            className={`font-sans text-[1.7rem] font-semibold leading-[1.02] tracking-[-0.03em] ${
              dark ? "text-white" : "text-[#172131]"
            }`}
          >
            <Link href={story.href} className={`transition ${dark ? "hover:text-[var(--accent-soft)]" : "hover:text-[#7b5a00]"}`}>
              {story.title}
            </Link>
          </h3>
        </div>

        <p className={`text-sm leading-7 ${dark ? "text-white/75" : "text-zinc-700"}`}>{story.excerpt}</p>

        <div className="pt-2">
          <Link
            href={story.href}
            className={`inline-flex items-center border-b pb-1 ln-ui text-[12px] font-bold uppercase tracking-[0.16em] transition ${
              dark
                ? "border-white/45 text-white hover:text-[var(--accent-soft)]"
                : "border-zinc-900 text-zinc-950 hover:text-[#7b5a00]"
            }`}
          >
            {story.readLabel || "Read more"}
          </Link>
        </div>
      </div>
    </article>
  );
}