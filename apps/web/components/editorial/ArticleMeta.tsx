// apps/web/components/editorial/ArticleMeta.tsx
import { Author } from "../../lib/editorial-data";

const dateTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

export function ArticleMeta({
  section,
  publishedAt,
  updatedAt,
  author,
}: {
  section: string;
  publishedAt: string;
  updatedAt: string;
  author: Author;
}) {
  const published = dateTimeFormatter.format(new Date(publishedAt));
  const updated = dateTimeFormatter.format(new Date(updatedAt));

  return (
    <div className="grid gap-6 border-y border-zinc-200 py-5 md:grid-cols-[1fr_auto] md:items-center">
      <div className="flex items-start gap-4">
        {author.avatar ? (
          <img
            src={author.avatar}
            alt={author.name}
            className="h-14 w-14 rounded-full object-cover"
          />
        ) : (
          <div className="h-14 w-14 rounded-full bg-zinc-200" />
        )}
        <div>
          <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">{section}</p>
          <p className="mt-1 text-base font-semibold text-zinc-950">{author.name}</p>
          <p className="text-sm text-zinc-600">{author.role}</p>
        </div>
      </div>

      <div className="text-sm text-zinc-600 md:text-right">
        <div>Published {published}</div>
        <div className="mt-1">Updated {updated}</div>
      </div>
    </div>
  );
}