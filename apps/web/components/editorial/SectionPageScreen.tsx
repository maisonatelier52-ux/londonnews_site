// app/web/components/editorial/SectionPageScreen.tsx
import Link from "next/link";
import type { CategoryView } from "../../lib/cms-types";
import { CategoryHero } from "./CategoryHero";
import { StoryGrid } from "./StoryGrid";
import { Container } from "../home/Container";
import { HeadlineStack } from "../home/HeadlineStack";

export function SectionPageScreen({
  section,
  eyebrow,
  canonicalPath
}: {
  section: CategoryView;
  eyebrow?: string;
  canonicalPath?: string;
}) {
  const hasPublishedStories = Boolean(section.leadStory);
  const stats =
    section.kind === "topic"
      ? [
          `${section.articleCount} published ${section.articleCount === 1 ? "story" : "stories"}`,
          section.siblingTopics.length > 0
            ? `${section.siblingTopics.length} sibling ${section.siblingTopics.length === 1 ? "topic" : "topics"}`
            : "Specialist topic page",
          section.parent ? `Inside ${section.parent.name}` : "Standalone topic"
        ]
      : [
          `${section.articleCount} published ${section.articleCount === 1 ? "story" : "stories"}`,
          section.childTopics.length > 0
            ? `${section.childTopics.length} topic ${section.childTopics.length === 1 ? "page" : "pages"}`
            : "Primary desk"
        ];

  const resolvedEyebrow =
    eyebrow || (section.kind === "topic" ? `${section.parent?.name || "News"} topic` : "Category");
  const deskPath = canonicalPath || section.href;

  return (
    <Container className="space-y-10 lg:space-y-12">
      <CategoryHero
        name={section.name}
        description={section.description}
        leadStory={section.leadStory}
        eyebrow={resolvedEyebrow}
        stats={stats}
      />

      {section.kind === "category" && section.childTopics.length > 0 ? (
        <section className="rounded-[2rem] border border-black/6 bg-white/82 p-6 shadow-[0_24px_70px_rgba(11,16,32,0.08)] backdrop-blur-sm md:p-8">
          <div className="flex flex-col gap-3 border-b border-black/8 pb-5 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="h-[2px] w-16 bg-[var(--accent)]" />
              <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#6a7280]">Topic pages</p>
              <h2 className="mt-3 font-sans text-[2.35rem] font-semibold leading-[0.98] tracking-[-0.04em] text-[#1a2433]">
                Inside {section.name}
              </h2>
            </div>
            <p className="max-w-2xl text-sm leading-8 text-[#56606d]">
              Readers can move between specialist beats inside the {section.name} desk, from broad coverage on the main section page to narrower topic reporting.
            </p>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {section.childTopics.map((topic) => (
              <Link
                key={topic.slug}
                href={topic.href}
                className="rounded-[1.75rem] border border-black/6 bg-[#f8f3eb] p-5 transition hover:-translate-y-0.5 hover:border-black/20 hover:bg-white"
              >
                <div className="flex items-center justify-between gap-3 text-[11px] uppercase tracking-[0.22em] text-[#6a7280]">
                  <span>Topic</span>
                  <span>{topic.articleCount || 0} stories</span>
                </div>
                <h3 className="mt-4 font-sans text-[1.75rem] font-semibold leading-[1] tracking-[-0.03em] text-[#1a2433]">
                  {topic.name}
                </h3>
                <p className="mt-3 text-sm leading-8 text-[#56606d]">
                  {topic.description || `Coverage from the ${topic.name} topic page.`}
                </p>
                <span className="mt-5 inline-flex text-[11px] font-semibold uppercase tracking-[0.22em] text-[#1f2b3b]">
                  Open topic
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {section.kind === "topic" && section.parent ? (
        <section className="rounded-[2rem] border border-black/6 bg-white/82 p-6 shadow-[0_24px_70px_rgba(11,16,32,0.08)] backdrop-blur-sm md:p-8">
          <div className="flex flex-col gap-3 border-b border-black/8 pb-5 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="h-[2px] w-16 bg-[var(--accent)]" />
              <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#6a7280]">Desk map</p>
              <h2 className="mt-3 font-sans text-[2.35rem] font-semibold leading-[0.98] tracking-[-0.04em] text-[#1a2433]">
                {section.parent.name}
              </h2>
            </div>
            <p className="max-w-2xl text-sm leading-8 text-[#56606d]">
              Move between the main {section.parent.name} desk and its specialist topic pages for a more legacy-paper reading path.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={section.parent.href}
              className="rounded-full border border-[#1f2b3b] bg-[#1f2b3b] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-white transition hover:bg-[#111928]"
            >
              Main {section.parent.name} desk
            </Link>
            {section.siblingTopics.map((item) => (
              <Link
                key={item.slug}
                href={item.href}
                className="rounded-full border border-black/10 bg-[#f8f3eb] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#324255] transition hover:border-black/20 hover:bg-white"
              >
                {item.name}
                {typeof item.articleCount === "number" ? ` (${item.articleCount})` : ""}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {hasPublishedStories ? (
        <>
          <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr] xl:items-start">
            <div className="xl:sticky xl:top-24">
              {section.featuredStories.length > 0 ? (
                <StoryGrid stories={section.featuredStories} columns={2} />
              ) : (
                <div className="rounded-[2rem] border border-dashed border-black/12 bg-white/72 px-6 py-8 text-sm text-[#56606d] shadow-[0_16px_50px_rgba(11,16,32,0.06)] backdrop-blur-sm">
                  Editors have not promoted featured stories in this {section.kind === "topic" ? "topic" : "category"} yet.
                </div>
              )}
            </div>
            <div>
              {section.mostRead.length > 0 ? (
                <HeadlineStack
                  items={section.mostRead.map((item) => ({
                    id: item.id,
                    title: item.title,
                    summary:
                      item.excerpt ||
                      "A compact stacked story module that keeps the legacy-paper feel while surfacing urgent or highly read coverage.",
                    href: item.href
                  }))}
                />
              ) : (
                <div className="rounded-[2rem] border border-dashed border-black/12 bg-white/72 px-6 py-8 text-sm text-[#56606d] shadow-[0_16px_50px_rgba(11,16,32,0.06)] backdrop-blur-sm">
                  Most-read slots will appear here once this {section.kind} has published more coverage.
                </div>
              )}
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex flex-col gap-4 border-b border-black/8 pb-4 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="h-[2px] w-16 bg-[var(--accent)]" />
                <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#6a7280]">Rolling file</p>
                <h2 className="mt-3 font-sans text-[2.35rem] font-semibold leading-[0.98] tracking-[-0.04em] text-[#1a2433]">
                  Latest in {section.name}
                </h2>
              </div>
              <span className="text-[11px] uppercase tracking-[0.24em] text-[#6a7280]">Updated continuously</span>
            </div>
            {section.latestStories.length > 0 ? (
              <StoryGrid stories={section.latestStories} columns={2} />
            ) : (
              <div className="rounded-[2rem] border border-dashed border-black/12 bg-white/72 px-6 py-8 text-sm text-[#56606d] shadow-[0_16px_50px_rgba(11,16,32,0.06)] backdrop-blur-sm">
                The latest-story grid will fill automatically as soon as this {section.kind} has more published pieces.
              </div>
            )}
          </section>
        </>
      ) : (
        <section className="rounded-[2rem] border border-black/6 bg-white/82 p-8 shadow-[0_24px_70px_rgba(11,16,32,0.08)] backdrop-blur-sm">
          <div className="h-[2px] w-16 bg-[var(--accent)]" />
          <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#6a7280]">
            {section.kind === "topic" ? "Topic status" : "Desk status"}
          </p>
          <h2 className="mt-3 font-sans text-[2.6rem] font-semibold leading-[0.96] tracking-[-0.04em] text-[#1a2433]">
            {section.kind === "topic" ? "Topic page ready for publishing" : "Category ready for publishing"}
          </h2>
          <p className="mt-4 max-w-3xl text-sm leading-8 text-[#56606d]">
            {section.kind === "topic"
              ? `The ${section.name} topic now sits inside the ${section.parent?.name || "London News"} taxonomy. Editors can route specialist reporting here from the article desk, and the page will populate automatically after the first approved publication.`
              : `The ${section.name} desk is now part of the London News taxonomy. Editors can start assigning stories to this category from the article desk, and this page will populate automatically after the first approved publication.`}
          </p>
          {deskPath !== section.href ? (
            <p className="mt-4 text-xs uppercase tracking-[0.22em] text-[#6a7280]">
              Legacy public route: {deskPath}
            </p>
          ) : null}
        </section>
      )}
    </Container>
  );
}
// import Link from "next/link";
// import type { CategoryView } from "../../lib/cms-types";
// import { CategoryHero } from "./CategoryHero";
// import { StoryGrid } from "./StoryGrid";
// import { Container } from "../home/Container";
// import { HeadlineStack } from "../home/HeadlineStack";

// export function SectionPageScreen({
//   section,
//   eyebrow,
//   canonicalPath
// }: {
//   section: CategoryView;
//   eyebrow?: string;
//   canonicalPath?: string;
// }) {
//   const hasPublishedStories = Boolean(section.leadStory);
//   const stats =
//     section.kind === "topic"
//       ? [
//           `${section.articleCount} published ${section.articleCount === 1 ? "story" : "stories"}`,
//           section.siblingTopics.length > 0
//             ? `${section.siblingTopics.length} sibling ${section.siblingTopics.length === 1 ? "topic" : "topics"}`
//             : "Specialist topic page",
//           section.parent ? `Inside ${section.parent.name}` : "Standalone topic"
//         ]
//       : [
//           `${section.articleCount} published ${section.articleCount === 1 ? "story" : "stories"}`,
//           section.childTopics.length > 0
//             ? `${section.childTopics.length} topic ${section.childTopics.length === 1 ? "page" : "pages"}`
//             : "Primary desk"
//         ];

//   const resolvedEyebrow =
//     eyebrow || (section.kind === "topic" ? `${section.parent?.name || "News"} topic` : "Category");
//   const deskPath = canonicalPath || section.href;

//   return (
//     <Container className="space-y-10 lg:space-y-12">
//       <CategoryHero
//         name={section.name}
//         description={section.description}
//         leadStory={section.leadStory}
//         eyebrow={resolvedEyebrow}
//         stats={stats}
//       />

//       {section.kind === "category" && section.childTopics.length > 0 ? (
//         <section className="rounded-[2rem] border border-black/6 bg-white/82 p-6 shadow-[0_24px_70px_rgba(11,16,32,0.08)] backdrop-blur-sm md:p-8">
//           <div className="flex flex-col gap-3 border-b border-black/8 pb-5 md:flex-row md:items-end md:justify-between">
//             <div>
//               <div className="h-[2px] w-16 bg-[var(--accent)]" />
//               <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#6a7280]">Topic pages</p>
//               <h2 className="mt-3 font-sans text-[2.35rem] font-semibold leading-[0.98] tracking-[-0.04em] text-[#1a2433]">
//                 Inside {section.name}
//               </h2>
//             </div>
//             <p className="max-w-2xl text-sm leading-8 text-[#56606d]">
//               Readers can move between specialist beats inside the {section.name} desk, from broad coverage on the main section page to narrower topic reporting.
//             </p>
//           </div>

//           <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
//             {section.childTopics.map((topic) => (
//               <Link
//                 key={topic.slug}
//                 href={topic.href}
//                 className="rounded-[1.75rem] border border-black/6 bg-[#f8f3eb] p-5 transition hover:-translate-y-0.5 hover:border-black/20 hover:bg-white"
//               >
//                 <div className="flex items-center justify-between gap-3 text-[11px] uppercase tracking-[0.22em] text-[#6a7280]">
//                   <span>Topic</span>
//                   <span>{topic.articleCount || 0} stories</span>
//                 </div>
//                 <h3 className="mt-4 font-sans text-[1.75rem] font-semibold leading-[1] tracking-[-0.03em] text-[#1a2433]">
//                   {topic.name}
//                 </h3>
//                 <p className="mt-3 text-sm leading-8 text-[#56606d]">
//                   {topic.description || `Coverage from the ${topic.name} topic page.`}
//                 </p>
//                 <span className="mt-5 inline-flex text-[11px] font-semibold uppercase tracking-[0.22em] text-[#1f2b3b]">
//                   Open topic
//                 </span>
//               </Link>
//             ))}
//           </div>
//         </section>
//       ) : null}

//       {section.kind === "topic" && section.parent ? (
//         <section className="rounded-[2rem] border border-black/6 bg-white/82 p-6 shadow-[0_24px_70px_rgba(11,16,32,0.08)] backdrop-blur-sm md:p-8">
//           <div className="flex flex-col gap-3 border-b border-black/8 pb-5 md:flex-row md:items-end md:justify-between">
//             <div>
//               <div className="h-[2px] w-16 bg-[var(--accent)]" />
//               <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#6a7280]">Desk map</p>
//               <h2 className="mt-3 font-sans text-[2.35rem] font-semibold leading-[0.98] tracking-[-0.04em] text-[#1a2433]">
//                 {section.parent.name}
//               </h2>
//             </div>
//             <p className="max-w-2xl text-sm leading-8 text-[#56606d]">
//               Move between the main {section.parent.name} desk and its specialist topic pages for a more legacy-paper reading path.
//             </p>
//           </div>

//           <div className="mt-6 flex flex-wrap gap-3">
//             <Link
//               href={section.parent.href}
//               className="rounded-full border border-[#1f2b3b] bg-[#1f2b3b] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-white transition hover:bg-[#111928]"
//             >
//               Main {section.parent.name} desk
//             </Link>
//             {section.siblingTopics.map((item) => (
//               <Link
//                 key={item.slug}
//                 href={item.href}
//                 className="rounded-full border border-black/10 bg-[#f8f3eb] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#324255] transition hover:border-black/20 hover:bg-white"
//               >
//                 {item.name}
//                 {typeof item.articleCount === "number" ? ` (${item.articleCount})` : ""}
//               </Link>
//             ))}
//           </div>
//         </section>
//       ) : null}

//       {hasPublishedStories ? (
//         <>
//           <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr] xl:items-start">
//             <div>
//               {section.featuredStories.length > 0 ? (
//                 <StoryGrid stories={section.featuredStories} columns={2} />
//               ) : (
//                 <div className="rounded-[2rem] border border-dashed border-black/12 bg-white/72 px-6 py-8 text-sm text-[#56606d] shadow-[0_16px_50px_rgba(11,16,32,0.06)] backdrop-blur-sm">
//                   Editors have not promoted featured stories in this {section.kind === "topic" ? "topic" : "category"} yet.
//                 </div>
//               )}
//             </div>
//             <div>
//               {section.mostRead.length > 0 ? (
//                 <HeadlineStack
//                   items={section.mostRead.map((item) => ({
//                     id: item.id,
//                     title: item.title,
//                     summary:
//                       item.excerpt ||
//                       "A compact stacked story module that keeps the legacy-paper feel while surfacing urgent or highly read coverage.",
//                     href: item.href
//                   }))}
//                 />
//               ) : (
//                 <div className="rounded-[2rem] border border-dashed border-black/12 bg-white/72 px-6 py-8 text-sm text-[#56606d] shadow-[0_16px_50px_rgba(11,16,32,0.06)] backdrop-blur-sm">
//                   Most-read slots will appear here once this {section.kind} has published more coverage.
//                 </div>
//               )}
//             </div>
//           </section>

//           <section className="space-y-6">
//             <div className="flex flex-col gap-4 border-b border-black/8 pb-4 md:flex-row md:items-end md:justify-between">
//               <div>
//                 <div className="h-[2px] w-16 bg-[var(--accent)]" />
//                 <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#6a7280]">Rolling file</p>
//                 <h2 className="mt-3 font-sans text-[2.35rem] font-semibold leading-[0.98] tracking-[-0.04em] text-[#1a2433]">
//                   Latest in {section.name}
//                 </h2>
//               </div>
//               <span className="text-[11px] uppercase tracking-[0.24em] text-[#6a7280]">Updated continuously</span>
//             </div>
//             {section.latestStories.length > 0 ? (
//               <StoryGrid stories={section.latestStories} columns={2} />
//             ) : (
//               <div className="rounded-[2rem] border border-dashed border-black/12 bg-white/72 px-6 py-8 text-sm text-[#56606d] shadow-[0_16px_50px_rgba(11,16,32,0.06)] backdrop-blur-sm">
//                 The latest-story grid will fill automatically as soon as this {section.kind} has more published pieces.
//               </div>
//             )}
//           </section>
//         </>
//       ) : (
//         <section className="rounded-[2rem] border border-black/6 bg-white/82 p-8 shadow-[0_24px_70px_rgba(11,16,32,0.08)] backdrop-blur-sm">
//           <div className="h-[2px] w-16 bg-[var(--accent)]" />
//           <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#6a7280]">
//             {section.kind === "topic" ? "Topic status" : "Desk status"}
//           </p>
//           <h2 className="mt-3 font-sans text-[2.6rem] font-semibold leading-[0.96] tracking-[-0.04em] text-[#1a2433]">
//             {section.kind === "topic" ? "Topic page ready for publishing" : "Category ready for publishing"}
//           </h2>
//           <p className="mt-4 max-w-3xl text-sm leading-8 text-[#56606d]">
//             {section.kind === "topic"
//               ? `The ${section.name} topic now sits inside the ${section.parent?.name || "London News"} taxonomy. Editors can route specialist reporting here from the article desk, and the page will populate automatically after the first approved publication.`
//               : `The ${section.name} desk is now part of the London News taxonomy. Editors can start assigning stories to this category from the article desk, and this page will populate automatically after the first approved publication.`}
//           </p>
//           {deskPath !== section.href ? (
//             <p className="mt-4 text-xs uppercase tracking-[0.22em] text-[#6a7280]">
//               Legacy public route: {deskPath}
//             </p>
//           ) : null}
//         </section>
//       )}
//     </Container>
//   );
// }
