import Link from "next/link";
import { HeadlineItem } from "../../lib/homepage-data";

export function HeadlineStack({ items }: { items: HeadlineItem[] }) {
  return (
    <section className="overflow-hidden rounded-[2rem] bg-[linear-gradient(180deg,rgba(11,16,32,0.95)_0%,rgba(11,16,32,1)_100%)] p-6 text-white shadow-[0_26px_70px_rgba(11,16,32,0.22)]">
      <div className="mb-6 flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <p className="ln-ui text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">Front page pulse</p>
          <h2 className="mt-3 font-sans text-[2rem] font-semibold tracking-[-0.04em] text-white">Top headlines</h2>
        </div>
        <span className="text-[11px] uppercase tracking-[0.24em] text-white/44">By priority</span>
      </div>

      <div className="space-y-6">
        {items.map((item, index) => (
          <article key={item.id} className="border-b border-white/10 pb-6 last:border-b-0 last:pb-0">
            <div className="mb-3 text-[11px] uppercase tracking-[0.24em] text-white/44">
              {String(index + 1).padStart(2, "0")}
            </div>
            <h3 className="font-sans text-[1.7rem] font-semibold leading-[1.02] tracking-[-0.03em] text-white">
              <Link href={item.href} className="transition hover:text-[var(--accent-soft)]">
                {item.title}
              </Link>
            </h3>
            <p className="mt-3 text-sm leading-7 text-white/72">{item.summary}</p>
            <Link
              href={item.href}
              className="mt-4 inline-flex items-center border-b border-white/35 pb-1 text-xs font-semibold uppercase tracking-[0.22em] text-white transition hover:text-[var(--accent-soft)]"
            >
              Open story
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
