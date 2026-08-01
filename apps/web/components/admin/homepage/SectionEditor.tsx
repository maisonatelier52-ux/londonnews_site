import { ArticlePicker } from "./ArticlePicker";
import {
  AdminHomepageSection,
  AdminHomepageSlot,
  KIND_OPTIONS,
  createEmptySlot,
} from "../../../lib/admin/homepage-utils";

export function SectionEditor({
  section,
  index,
  total,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  section: AdminHomepageSection;
  index: number;
  total: number;
  onChange: (next: AdminHomepageSection) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const isGoodNewsSection = section.key === "leadStory";
  const slotLimit = isGoodNewsSection ? 6 : undefined;
  const reachedSlotLimit = typeof slotLimit === "number" && section.slots.length >= slotLimit;

  function updateSlot(slotIndex: number, nextSlot: AdminHomepageSlot) {
    const nextSlots = [...section.slots];
    nextSlots[slotIndex] = nextSlot;
    onChange({ ...section, slots: nextSlots });
  }

  function removeSlot(slotIndex: number) {
    const nextSlots = section.slots.filter((_, i) => i !== slotIndex);
    onChange({ ...section, slots: nextSlots });
  }

  function moveSlot(slotIndex: number, direction: -1 | 1) {
    const target = slotIndex + direction;
    if (target < 0 || target >= section.slots.length) return;
    const nextSlots = [...section.slots];
    const temp = nextSlots[slotIndex];
    nextSlots[slotIndex] = nextSlots[target];
    nextSlots[target] = temp;
    onChange({ ...section, slots: nextSlots });
  }

  return (
    <section className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 border-b border-zinc-200 pb-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="grid flex-1 gap-4 md:grid-cols-3">
          <label className="block">
            <span className="mb-1 block text-[11px] uppercase tracking-[0.22em] text-zinc-500">Section key</span>
            <input
              value={section.key}
              onChange={(e) => onChange({ ...section, key: e.target.value })}
              className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-[11px] uppercase tracking-[0.22em] text-zinc-500">Kind</span>
            <select
              value={section.kind}
              onChange={(e) => onChange({ ...section, kind: e.target.value })}
              className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
            >
              {KIND_OPTIONS.map((kind) => (
                <option key={kind} value={kind}>
                  {kind}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-[11px] uppercase tracking-[0.22em] text-zinc-500">Display title</span>
            <input
              value={section.title || ""}
              onChange={(e) => onChange({ ...section, title: e.target.value })}
              className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
            />
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={index === 0}
            className="rounded-xl border border-zinc-300 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-700 disabled:opacity-40"
          >
            Move up
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={index === total - 1}
            className="rounded-xl border border-zinc-300 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-700 disabled:opacity-40"
          >
            Move down
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="rounded-xl border border-red-300 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-red-700"
          >
            Remove section
          </button>
        </div>
      </div>

      {isGoodNewsSection ? (
        <p className="mt-4 text-sm leading-7 text-zinc-600">
          Slot 1 is the featured good-news story. Slots 2 through 6 feed the horizontal good-news slider on the homepage.
        </p>
      ) : null}

      <div className="mt-5 space-y-4">
        {section.slots.map((slot, slotIndex) => (
          <div key={`${section.key}-slot-${slotIndex}`} className="rounded-[1.5rem] border border-zinc-200 bg-stone-50 p-4">
            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">
                  Slot {slotIndex + 1}
                </p>
                <h4 className="mt-1 text-base font-semibold text-zinc-950">
                  {slot.article?.title || "No article selected"}
                </h4>
                {slot.article ? (
                  <p className="mt-1 text-sm text-zinc-600">
                    {slot.article.section?.name || slot.article.section?.slug || "News"}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => moveSlot(slotIndex, -1)}
                  disabled={slotIndex === 0}
                  className="rounded-xl border border-zinc-300 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-700 disabled:opacity-40"
                >
                  Up
                </button>
                <button
                  type="button"
                  onClick={() => moveSlot(slotIndex, 1)}
                  disabled={slotIndex === section.slots.length - 1}
                  className="rounded-xl border border-zinc-300 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-700 disabled:opacity-40"
                >
                  Down
                </button>
                <button
                  type="button"
                  onClick={() => removeSlot(slotIndex)}
                  className="rounded-xl border border-red-300 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-red-700"
                >
                  Remove slot
                </button>
              </div>
            </div>

            <ArticlePicker
              onSelect={(article) =>
                updateSlot(slotIndex, {
                  ...slot,
                  articleId: article.id,
                  article: {
                    id: article.id,
                    title: article.title,
                    section: {
                      name: article.section,
                      slug: article.section.toLowerCase().replace(/\s+/g, "-"),
                    },
                    seo: {
                      slug: article.slug,
                    },
                    heroImage: article.heroImage || null,
                  },
                })
              }
            />

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-[11px] uppercase tracking-[0.22em] text-zinc-500">Title override</span>
                <input
                  value={slot.titleOverride || ""}
                  onChange={(e) => updateSlot(slotIndex, { ...slot, titleOverride: e.target.value })}
                  className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-[11px] uppercase tracking-[0.22em] text-zinc-500">Kicker override</span>
                <input
                  value={slot.kickerOverride || ""}
                  onChange={(e) => updateSlot(slotIndex, { ...slot, kickerOverride: e.target.value })}
                  className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
                />
              </label>

              <label className="block md:col-span-2">
                <span className="mb-1 block text-[11px] uppercase tracking-[0.22em] text-zinc-500">Excerpt override</span>
                <textarea
                  value={slot.excerptOverride || ""}
                  onChange={(e) => updateSlot(slotIndex, { ...slot, excerptOverride: e.target.value })}
                  className="min-h-[84px] w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-[11px] uppercase tracking-[0.22em] text-zinc-500">Image override URL</span>
                <input
                  value={slot.imageOverride || ""}
                  onChange={(e) => updateSlot(slotIndex, { ...slot, imageOverride: e.target.value })}
                  className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-[11px] uppercase tracking-[0.22em] text-zinc-500">Href override</span>
                <input
                  value={slot.hrefOverride || ""}
                  onChange={(e) => updateSlot(slotIndex, { ...slot, hrefOverride: e.target.value })}
                  className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
                />
              </label>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={() => onChange({ ...section, slots: [...section.slots, createEmptySlot(section.slots.length + 1)] })}
          disabled={reachedSlotLimit}
          className="inline-flex items-center rounded-xl bg-zinc-950 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-white disabled:cursor-not-allowed disabled:opacity-45"
        >
          {reachedSlotLimit ? "Max slots reached" : "Add slot"}
        </button>
      </div>
    </section>
  );
}
