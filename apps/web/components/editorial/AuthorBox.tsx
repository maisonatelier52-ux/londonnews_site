// apps/web/components/editorial/AuthorBox.tsx
import { Author } from "../../lib/editorial-data";

export function AuthorBox({ author }: { author: Author }) {
  return (
    <section className="rounded-[2rem] border border-black/6 bg-white/82 p-6 shadow-[0_18px_44px_rgba(17,24,39,0.08)] backdrop-blur-sm">
      <div className="flex items-start gap-4">
        {author.avatar ? (
          <img src={author.avatar} alt={author.name} className="h-16 w-16 rounded-full object-cover" />
        ) : (
          <div className="h-16 w-16 rounded-full bg-zinc-200" />
        )}
        <div>
          <p className="ln-ui text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">About the author</p>
          <h3 className="mt-2 font-sans text-[2rem] font-semibold tracking-[-0.04em] text-[#172131]">{author.name}</h3>
          <p className="mt-1 text-sm text-zinc-600">{author.role}</p>
          <p className="mt-4 text-sm leading-7 text-zinc-700">{author.bio}</p>
        </div>
      </div>
    </section>
  );
}
