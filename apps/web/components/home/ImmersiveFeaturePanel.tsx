
// apps/web/components/home/ImmersiveFeaturePanel.tsx
import Link from "next/link";
import { Story } from "../../lib/homepage-data";
import { absoluteUrl } from "../../lib/cms/utils";
import { SocialShareRail } from "./SocialShareRail";

export function ImmersiveFeaturePanel({
  story,
  muted = false,
  minHeight = "min-h-[540px] lg:min-h-[760px]"
}: {
  story: Story;
  muted?: boolean;
  minHeight?: string;
}) {
  return (
    <article className={`relative overflow-hidden ${minHeight}`}>
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${story.image})` }} />
      <div
        className={`absolute inset-0 ${
          muted
            ? "bg-[linear-gradient(180deg,rgba(195,186,175,0.45)_0%,rgba(42,34,28,0.35)_100%)]"
            : "bg-[linear-gradient(180deg,rgba(10,10,10,0.1)_0%,rgba(10,10,10,0.28)_45%,rgba(10,10,10,0.74)_100%)]"
        }`}
      />

      <div className="relative z-10 mx-auto flex h-full max-w-[1440px] flex-col justify-end px-4 py-10 sm:px-8 lg:px-12 lg:py-12">
        <div className="mb-6">
          <SocialShareRail light url={absoluteUrl(story.href)} title={story.title} />
        </div>
        <div className="max-w-[760px]">
          <p className="ln-ui text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">
            {story.section}
          </p>
          <h2 className="mt-4 font-sans text-[2.35rem] font-semibold leading-[0.96] tracking-[-0.04em] text-white sm:text-[3.25rem] lg:text-[4.4rem]">
            <Link href={story.href} className="transition hover:text-[var(--accent-soft)]">
              {story.title}
            </Link>
          </h2>
          <p className="mt-5 max-w-[720px] text-base leading-8 text-white/75">{story.excerpt}</p>
        </div>
      </div>
    </article>
  );
}
