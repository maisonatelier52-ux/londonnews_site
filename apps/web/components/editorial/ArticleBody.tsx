// apps/web/components/editorial/ArticleBody.tsx
import Link from "next/link";
import type { BodyBlock } from "../../lib/cms-types";

export function ArticleBody({ blocks }: { blocks: BodyBlock[] }) {
  return (
    <div className="space-y-6">
      {blocks.map((block, index) => {
        if (block.type === "paragraph") {
          return (
            <p key={index} className="text-[1.05rem] leading-8 text-zinc-800">
              {block.content}
            </p>
          );
        }

        if (block.type === "subhead") {
          return (
            <h2 key={index} className="font-news text-3xl leading-tight text-zinc-950">
              {block.content}
            </h2>
          );
        }

        if (block.type === "quote") {
          return (
            <figure key={index} className="rounded-[2rem] border border-zinc-200 bg-stone-100 px-6 py-8">
              <blockquote className="font-news text-3xl leading-snug text-zinc-950">
                “{block.content}”
              </blockquote>
              {block.attribution ? (
                <figcaption className="mt-4 text-sm uppercase tracking-[0.22em] text-zinc-500">
                  {block.attribution}
                </figcaption>
              ) : null}
            </figure>
          );
        }

        if (block.type === "list") {
          return (
            <ul key={index} className="list-disc space-y-3 pl-6 text-[1.02rem] leading-8 text-zinc-800">
              {block.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          );
        }

        if (block.type === "image") {
          return (
            <figure key={index} className="overflow-hidden rounded-[2rem] border border-zinc-200 bg-white shadow-sm">
              <img src={block.src} alt={block.alt} className="h-auto w-full object-cover" />
              {block.caption ? (
                <figcaption className="px-5 py-4 text-sm leading-6 text-zinc-600">
                  {block.caption}
                </figcaption>
              ) : null}
            </figure>
          );
        }

        if (block.type === "embed") {
          return (
            <div key={index} className="rounded-[2rem] border border-dashed border-zinc-300 bg-stone-50 px-6 py-6">
              <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Embedded reference</p>
              <a
                href={block.href}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center text-base font-semibold text-zinc-950 underline decoration-zinc-300 underline-offset-4 transition hover:decoration-zinc-900"
              >
                {block.label || block.href}
              </a>
            </div>
          );
        }

        if (block.type === "related") {
          return (
            <Link
              key={index}
              href={block.href}
              className="block rounded-[2rem] border border-zinc-200 bg-stone-50 px-6 py-6 transition hover:border-zinc-900"
            >
              <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Related coverage</p>
              <h3 className="mt-3 font-news text-2xl text-zinc-950">{block.title}</h3>
              {block.summary ? (
                <p className="mt-3 text-sm leading-7 text-zinc-700">{block.summary}</p>
              ) : null}
            </Link>
          );
        }

        return null;
      })}
    </div>
  );
}
