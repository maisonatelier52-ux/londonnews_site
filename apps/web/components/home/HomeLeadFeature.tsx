// app/web/components/home/HomeLeadFeature.tsx
import Link from "next/link";
import { Story } from "../../lib/homepage-data";

export function HomeLeadFeature({
  story,
  sectionTitle,
  sliderStories = []
}: {
  story: Story;
  sectionTitle?: string;
  sliderStories?: Story[];
}) {
  const railStories = sliderStories.slice(0, 5);

  return (
    <>
      <style jsx>{`
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      <section className="relative min-h-[720px] overflow-hidden lg:min-h-[980px]">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${
              story.image ||
              "https://london-news-two.vercel.app/images/homepageimages/sky_bg_image2.webp"
            })`
          }}
        />

        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(9,9,11,0.18)_0%,rgba(9,9,11,0.42)_44%,rgba(9,9,11,0.78)_100%)]" />


        <div className="relative z-10 mx-auto flex min-h-[720px] max-w-[1440px] flex-col justify-between px-4 py-10 sm:px-8 lg:min-h-[980px] lg:px-12 lg:py-14">

          <article className="max-w-[860px] pb-2">

            <p className="ln-ui text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">
              {sectionTitle || story.kicker || story.section}
            </p>


            <h3 className="mt-4 max-w-[900px] font-sans text-[2.4rem] font-semibold leading-[0.95] tracking-[-0.04em] text-white sm:text-[3.5rem] lg:text-[4.8rem]">
              <Link
                href={story.href}
                className="transition hover:text-[var(--accent-soft)]"
              >
                {story.title}
              </Link>
            </h3>


            <p className="mt-6 max-w-[720px] text-base leading-8 text-white/75 sm:text-lg">
              {story.excerpt}
            </p>


            <Link
              href={story.href}
              className="mt-8 inline-flex items-center border-b border-white pb-1 ln-ui text-[12px] font-bold uppercase tracking-[0.16em] text-white transition hover:text-[var(--accent-soft)]"
            >
              {story.readLabel || "Read more"}
            </Link>


            {railStories.length ? (
              <div className="mt-10 border-t border-white/15 pt-6">

                <div
                  className="
                    -mx-4
                    overflow-x-auto
                    pb-4
                    hide-scrollbar
                    sm:-mx-8
                    lg:-mx-12
                  "
                >

                  <div className="flex min-w-max snap-x snap-mandatory gap-4 px-4 sm:px-8 lg:px-12">

                    {railStories.map((item) => (

                      <article
                        key={item.id}
                        className="
                          w-[260px]
                          shrink-0
                          snap-start
                          rounded-[1.6rem]
                          border
                          border-white/12
                          bg-white/8
                          p-5
                          backdrop-blur-sm
                        "
                      >

                        <p className="ln-ui text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--accent-soft)]">
                          {item.section}
                        </p>


                        <h4 className="mt-3 font-sans text-[1.2rem] font-semibold leading-[1.02] tracking-[-0.03em] text-white">
                          <Link
                            href={item.href}
                            className="transition hover:text-[var(--accent-soft)]"
                          >
                            {item.title}
                          </Link>
                        </h4>


                        <p className="mt-3 text-sm leading-6 text-white/75">
                          {item.excerpt}
                        </p>


                        <Link
                          href={item.href}
                          className="
                            mt-4
                            inline-flex
                            items-center
                            border-b
                            border-white/35
                            pb-1
                            ln-ui
                            text-[11px]
                            font-bold
                            uppercase
                            tracking-[0.16em]
                            text-white
                            transition
                            hover:text-[var(--accent-soft)]
                          "
                        >
                          {item.readLabel || "Read more"}
                        </Link>

                      </article>

                    ))}

                  </div>

                </div>

              </div>
            ) : null}

          </article>

        </div>
      </section>
    </>
  );
}
