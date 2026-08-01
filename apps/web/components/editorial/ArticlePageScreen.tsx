// apps/web/components/editorial/ArticlePageScreen.tsx
import Link from "next/link";
import type { HomepageView, ArticleView } from "../../lib/cms-types";
import { ArticleBody } from "./ArticleBody";
import { ArticleMeta } from "./ArticleMeta";
import { ArticleSidebar } from "./ArticleSidebar";
import { AuthorBox } from "./AuthorBox";
import { CorrectionNotesPanel } from "./CorrectionNotesPanel";
import { StoryGrid } from "./StoryGrid";
import { Container } from "../home/Container";
import { FooterMark } from "../home/FooterMark";
import { TopNav } from "../home/TopNav";

export function ArticlePageScreen({
  article,
  homepage,
  previewLabel
}: {
  article: ArticleView;
  homepage?: HomepageView | null;
  previewLabel?: string;
}) {
  const sectionLabel = article.parentSection ? `${article.parentSection.name} / ${article.section}` : article.section;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.38),transparent_22%),linear-gradient(180deg,#f3efe8_0%,#eee6db_100%)] text-zinc-950">
      {previewLabel ? (
        <div className="border-b border-amber-300 bg-amber-50 px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.22em] text-amber-900">
          {previewLabel}
        </div>
      ) : null}

      {homepage ? <TopNav data={homepage} /> : null}

      <main className="pb-16">
        <section className="ln-hero-surface border-b border-black/5">
          <Container className="py-12 lg:py-16">
            <div className="flex flex-wrap items-center gap-3 text-[11px] uppercase tracking-[0.22em] text-zinc-600">
              <Link href="/" className="transition hover:text-zinc-950">
                Home
              </Link>
              <span>/</span>
              {article.parentSection ? (
                <>
                  <Link href={article.parentSection.href} className="transition hover:text-zinc-950">
                    {article.parentSection.name}
                  </Link>
                  <span>/</span>
                </>
              ) : null}
              {article.sectionHref ? (
                <>
                  <Link href={article.sectionHref} className="transition hover:text-zinc-950">
                    {article.section}
                  </Link>
                  <span>/</span>
                </>
              ) : null}
              <span>Story</span>
            </div>

            <div className="mt-7 grid gap-8 xl:grid-cols-[minmax(0,0.96fr)_minmax(320px,1.04fr)] xl:items-end">
              <div className="rounded-[2rem] border border-white/35 bg-white/82 p-6 shadow-[0_24px_70px_rgba(17,24,39,0.08)] backdrop-blur-sm md:p-8">
                <p className="ln-ui text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">
                  {sectionLabel}
                </p>
                <h1 className="mt-5 font-sans text-[2rem] font-semibold leading-[0.93] tracking-[-0.05em] text-[#172131] sm:text-[3rem] lg:text-[4rem]">
                  {article.title}
                </h1>
                <p className="mt-6 max-w-4xl text-md leading-5 text-zinc-700">{article.dek}</p>

                <div className="mt-8">
                  <ArticleMeta
                    section={sectionLabel}
                    publishedAt={article.publishedAt}
                    updatedAt={article.updatedAt}
                    author={article.author}
                  />
                </div>
              </div>

              <div className="overflow-hidden rounded-[2rem] border border-white/35 shadow-[0_28px_80px_rgba(17,24,39,0.12)]">
                <img src={article.heroImage} alt={article.heroAlt} className="h-full w-full object-cover" />
              </div>
            </div>
          </Container>
        </section>

        <Container className="space-y-10 py-10 lg:py-14">
          {/* <section className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className="space-y-8">
              <CorrectionNotesPanel notes={article.correctionNotes} />

              <section className="rounded-[2rem] border border-black/6 bg-white/84 p-6 shadow-[0_22px_54px_rgba(17,24,39,0.08)] backdrop-blur-sm md:p-8">
                <ArticleBody blocks={article.body} />
              </section>

              <AuthorBox author={article.author} />
            </div>

            <ArticleSidebar mostRead={article.mostRead} events={article.events} />
          </section> */}
          <section className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className="space-y-8 self-start lg:sticky lg:top-24">
              <CorrectionNotesPanel notes={article.correctionNotes} />

              <section className="rounded-[2rem] border border-black/6 bg-white/84 p-6 shadow-[0_22px_54px_rgba(17,24,39,0.08)] backdrop-blur-sm md:p-8">
                <ArticleBody blocks={article.body} />
              </section>

              <AuthorBox author={article.author} />
            </div>

            <ArticleSidebar mostRead={article.mostRead} events={article.events} />
          </section>

          <section className="rounded-[2.2rem] bg-[linear-gradient(180deg,rgba(11,16,32,0.95)_0%,rgba(11,16,32,1)_100%)] px-6 py-8 text-white shadow-[0_28px_80px_rgba(11,16,32,0.24)] lg:px-8">
            <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-5">
              <div>
                <p className="ln-ui text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">
                  Continue reading
                </p>
                <h2 className="mt-3 font-sans text-[2.2rem] font-semibold tracking-[-0.04em] text-white">
                  Related stories
                </h2>
              </div>
              <span className="text-[11px] uppercase tracking-[0.24em] text-white/44">Editor’s picks</span>
            </div>
            <div className="mt-6">
              <StoryGrid stories={article.relatedStories} columns={3} dark />
            </div>
          </section>
        </Container>
      </main>

      {homepage ? <FooterMark data={homepage} /> : null}
    </div>
  );
}