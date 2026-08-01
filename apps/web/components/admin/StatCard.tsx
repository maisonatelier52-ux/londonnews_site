// apps/web/components/admin/homepage/StatCard.tsx
import type { LucideIcon } from "lucide-react";

export function StatCard({
  eyebrow,
  value,
  title,
  description,
  icon: Icon,
  iconClassName
}: {
  eyebrow: string;
  value: string | number;
  title: string;
  description: string;
  icon?: LucideIcon;
  iconClassName?: string;
}) {
  return (
    <article className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">{eyebrow}</p>
        {Icon ? (
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconClassName ?? "bg-zinc-100 text-zinc-600"}`}
          >
            <Icon className="h-5 w-5" strokeWidth={2} />
          </span>
        ) : null}
      </div>
      <div className="mt-4 flex items-end gap-3">
        <span className="font-news text-5xl text-zinc-950">{value}</span>
        <span className="pb-2 text-sm font-medium text-zinc-600">{title}</span>
      </div>
      <p className="mt-3 text-sm leading-7 text-zinc-700">{description}</p>
    </article>
  );
}
