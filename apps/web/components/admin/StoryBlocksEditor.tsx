import type { BodyBlock } from "../../lib/cms-types";

type Props = {
  blocks: BodyBlock[];
  onChange: (blocks: BodyBlock[]) => void;
};

const BLOCK_LIBRARY: Array<{ type: BodyBlock["type"]; label: string }> = [
  { type: "paragraph", label: "Paragraph" },
  { type: "subhead", label: "Subhead" },
  { type: "quote", label: "Pull quote" },
  { type: "list", label: "Bullet list" },
  { type: "image", label: "Inline image" },
  { type: "embed", label: "Embed link" },
  { type: "related", label: "Related link" }
];

function createBlock(type: BodyBlock["type"]): BodyBlock {
  if (type === "paragraph") return { type, content: "" };
  if (type === "subhead") return { type, content: "" };
  if (type === "quote") return { type, content: "", attribution: "" };
  if (type === "list") return { type, items: [""] };
  if (type === "image") return { type, src: "", alt: "", caption: "" };
  if (type === "embed") return { type, href: "", label: "" };
  return { type: "related", title: "", href: "", summary: "" };
}

export function StoryBlocksEditor({ blocks, onChange }: Props) {
  function updateBlock(index: number, nextBlock: BodyBlock) {
    const next = [...blocks];
    next[index] = nextBlock;
    onChange(next);
  }

  function moveBlock(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= blocks.length) return;
    const next = [...blocks];
    const temp = next[index];
    next[index] = next[target];
    next[target] = temp;
    onChange(next);
  }

  function removeBlock(index: number) {
    onChange(blocks.filter((_, itemIndex) => itemIndex !== index));
  }

  function addBlock(type: BodyBlock["type"]) {
    onChange([...blocks, createBlock(type)]);
  }

  function updateListItems(index: number, value: string) {
    const items = value
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);
    updateBlock(index, { type: "list", items: items.length ? items : [""] });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {BLOCK_LIBRARY.map((block) => (
          <button
            key={block.type}
            type="button"
            onClick={() => addBlock(block.type)}
            className="rounded-full border border-zinc-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-700"
          >
            Add {block.label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {blocks.map((block, index) => (
          <article key={`${block.type}-${index}`} className="rounded-[1.5rem] border border-zinc-200 bg-stone-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">
                {BLOCK_LIBRARY.find((item) => item.type === block.type)?.label || block.type}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => moveBlock(index, -1)}
                  className="rounded-full border border-zinc-300 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-700"
                >
                  Up
                </button>
                <button
                  type="button"
                  onClick={() => moveBlock(index, 1)}
                  className="rounded-full border border-zinc-300 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-700"
                >
                  Down
                </button>
                <button
                  type="button"
                  onClick={() => removeBlock(index)}
                  className="rounded-full border border-rose-200 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-rose-700"
                >
                  Remove
                </button>
              </div>
            </div>

            <div className="mt-4 space-y-4">
              {(block.type === "paragraph" || block.type === "subhead") ? (
                <textarea
                  value={block.content}
                  onChange={(event) => updateBlock(index, { ...block, content: event.target.value })}
                  className="min-h-[110px] w-full rounded-xl border border-zinc-300 bg-white px-3 py-3 text-sm"
                  placeholder={block.type === "subhead" ? "Section subhead" : "Write this paragraph"}
                />
              ) : null}

              {block.type === "quote" ? (
                <div className="grid gap-4">
                  <textarea
                    value={block.content}
                    onChange={(event) => updateBlock(index, { ...block, content: event.target.value })}
                    className="min-h-[110px] w-full rounded-xl border border-zinc-300 bg-white px-3 py-3 text-sm"
                    placeholder="Write the pull quote"
                  />
                  <input
                    value={block.attribution || ""}
                    onChange={(event) => updateBlock(index, { ...block, attribution: event.target.value })}
                    className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-3 text-sm"
                    placeholder="Attribution"
                  />
                </div>
              ) : null}

              {block.type === "list" ? (
                <textarea
                  value={block.items.join("\n")}
                  onChange={(event) => updateListItems(index, event.target.value)}
                  className="min-h-[140px] w-full rounded-xl border border-zinc-300 bg-white px-3 py-3 text-sm"
                  placeholder={"First bullet\nSecond bullet\nThird bullet"}
                />
              ) : null}

              {block.type === "image" ? (
                <div className="grid gap-4">
                  <input
                    value={block.src}
                    onChange={(event) => updateBlock(index, { ...block, src: event.target.value })}
                    className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-3 text-sm"
                    placeholder="Image URL"
                  />
                  <input
                    value={block.alt}
                    onChange={(event) => updateBlock(index, { ...block, alt: event.target.value })}
                    className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-3 text-sm"
                    placeholder="Alt text"
                  />
                  <textarea
                    value={block.caption || ""}
                    onChange={(event) => updateBlock(index, { ...block, caption: event.target.value })}
                    className="min-h-[90px] w-full rounded-xl border border-zinc-300 bg-white px-3 py-3 text-sm"
                    placeholder="Caption"
                  />
                </div>
              ) : null}

              {block.type === "embed" ? (
                <div className="grid gap-4">
                  <input
                    value={block.label || ""}
                    onChange={(event) => updateBlock(index, { ...block, label: event.target.value })}
                    className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-3 text-sm"
                    placeholder="Embed label"
                  />
                  <input
                    value={block.href}
                    onChange={(event) => updateBlock(index, { ...block, href: event.target.value })}
                    className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-3 text-sm"
                    placeholder="https://..."
                  />
                </div>
              ) : null}

              {block.type === "related" ? (
                <div className="grid gap-4">
                  <input
                    value={block.title}
                    onChange={(event) => updateBlock(index, { ...block, title: event.target.value })}
                    className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-3 text-sm"
                    placeholder="Related story title"
                  />
                  <input
                    value={block.href}
                    onChange={(event) => updateBlock(index, { ...block, href: event.target.value })}
                    className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-3 text-sm"
                    placeholder="/articles/story-slug"
                  />
                  <textarea
                    value={block.summary || ""}
                    onChange={(event) => updateBlock(index, { ...block, summary: event.target.value })}
                    className="min-h-[90px] w-full rounded-xl border border-zinc-300 bg-white px-3 py-3 text-sm"
                    placeholder="Optional related-story summary"
                  />
                </div>
              ) : null}
            </div>
          </article>
        ))}
      </div>

      {blocks.length === 0 ? (
        <div className="rounded-[1.5rem] border border-dashed border-zinc-300 bg-stone-50 p-6 text-sm text-zinc-500">
          Add story blocks to build the article body.
        </div>
      ) : null}
    </div>
  );
}
