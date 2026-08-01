import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

type PaginationProps = {
  page: number;
  pageSize: number;
  totalCount: number;
  basePath: string;
  status?: string;
  q?: string;
  itemLabel?: string;
};

function buildPageList(current: number, total: number): (number | "ellipsis")[] {
  const keep = new Set<number>([1, total, current - 1, current, current + 1]);
  const valid = [...keep].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);

  const result: (number | "ellipsis")[] = [];
  let prev = 0;
  for (const p of valid) {
    if (prev && p - prev > 1) result.push("ellipsis");
    result.push(p);
    prev = p;
  }
  return result;
}

export function Pagination({ page, pageSize, totalCount, basePath, status, q, itemLabel = "stories" }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const from = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalCount);

  const hrefFor = (targetPage: number) => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (q) params.set("q", q);
    params.set("page", String(targetPage));
    return `${basePath}?${params.toString()}`;
  };

  const pages = buildPageList(page, totalPages);
  const canPrev = page > 1;
  const canNext = page < totalPages;

  const chevronClass =
    "flex h-9 w-9 items-center justify-center rounded-full border border-zinc-300 text-zinc-700 transition hover:bg-stone-50";
  const chevronDisabledClass = "flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 text-zinc-300";

  return (
    <div className="mt-4 flex flex-col gap-4 border-t border-zinc-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-1">
        {canPrev ? (
          <Link href={hrefFor(page - 1)} aria-label="Previous page" className={chevronClass}>
            <ChevronLeft className="h-4 w-4" strokeWidth={2} />
          </Link>
        ) : (
          <span aria-hidden className={chevronDisabledClass}>
            <ChevronLeft className="h-4 w-4" strokeWidth={2} />
          </span>
        )}

        {pages.map((p, index) =>
          p === "ellipsis" ? (
            <span key={`ellipsis-${index}`} className="px-1 text-sm text-zinc-400">
              …
            </span>
          ) : (
            <Link
              key={p}
              href={hrefFor(p)}
              aria-current={p === page ? "page" : undefined}
              className={
                p === page
                  ? "flex h-9 w-9 items-center justify-center rounded-full bg-zinc-950 text-sm font-semibold text-white"
                  : "flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium text-zinc-700 transition hover:bg-stone-100"
              }
            >
              {p}
            </Link>
          )
        )}

        {canNext ? (
          <Link href={hrefFor(page + 1)} aria-label="Next page" className={chevronClass}>
            <ChevronRight className="h-4 w-4" strokeWidth={2} />
          </Link>
        ) : (
          <span aria-hidden className={chevronDisabledClass}>
            <ChevronRight className="h-4 w-4" strokeWidth={2} />
          </span>
        )}
      </div>

      <p className="text-sm text-zinc-500">
        Showing {from} to {to} of {totalCount} {itemLabel}
      </p>
    </div>
  );
}