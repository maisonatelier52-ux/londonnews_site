import type { BodyBlock } from "../cms-types";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function normalizeParagraph(content: unknown): BodyBlock | null {
  if (typeof content !== "string" || !content.trim()) return null;
  return { type: "paragraph", content: content.trim() };
}

function normalizeSubhead(content: unknown): BodyBlock | null {
  if (typeof content !== "string" || !content.trim()) return null;
  return { type: "subhead", content: content.trim() };
}

function normalizeQuote(block: Record<string, unknown>): BodyBlock | null {
  if (typeof block.content !== "string" || !block.content.trim()) return null;
  return {
    type: "quote",
    content: block.content.trim(),
    attribution: typeof block.attribution === "string" && block.attribution.trim()
      ? block.attribution.trim()
      : undefined
  };
}

function normalizeList(block: Record<string, unknown>): BodyBlock | null {
  if (!isStringArray(block.items)) return null;
  const items = block.items.map((item) => item.trim()).filter(Boolean);
  if (!items.length) return null;
  return { type: "list", items };
}

function normalizeImage(block: Record<string, unknown>): BodyBlock | null {
  if (typeof block.src !== "string" || !block.src.trim()) return null;
  const alt = typeof block.alt === "string" && block.alt.trim() ? block.alt.trim() : "Article image";
  return {
    type: "image",
    src: block.src.trim(),
    alt,
    caption: typeof block.caption === "string" && block.caption.trim() ? block.caption.trim() : undefined
  };
}

function normalizeEmbed(block: Record<string, unknown>): BodyBlock | null {
  if (typeof block.href !== "string" || !block.href.trim()) return null;
  return {
    type: "embed",
    href: block.href.trim(),
    label: typeof block.label === "string" && block.label.trim() ? block.label.trim() : undefined
  };
}

function normalizeRelated(block: Record<string, unknown>): BodyBlock | null {
  if (typeof block.title !== "string" || !block.title.trim()) return null;
  if (typeof block.href !== "string" || !block.href.trim()) return null;
  return {
    type: "related",
    title: block.title.trim(),
    href: block.href.trim(),
    summary: typeof block.summary === "string" && block.summary.trim() ? block.summary.trim() : undefined
  };
}

export function normalizeBodyBlocks(input: unknown): BodyBlock[] {
  if (!Array.isArray(input)) return [];

  const blocks: BodyBlock[] = [];

  for (const item of input) {
    if (!isObject(item) || typeof item.type !== "string") continue;

    if (item.type === "paragraph") {
      const block = normalizeParagraph(item.content);
      if (block) blocks.push(block);
      continue;
    }

    if (item.type === "subhead") {
      const block = normalizeSubhead(item.content);
      if (block) blocks.push(block);
      continue;
    }

    if (item.type === "quote") {
      const block = normalizeQuote(item);
      if (block) blocks.push(block);
      continue;
    }

    if (item.type === "list") {
      const block = normalizeList(item);
      if (block) blocks.push(block);
      continue;
    }

    if (item.type === "image") {
      const block = normalizeImage(item);
      if (block) blocks.push(block);
      continue;
    }

    if (item.type === "embed") {
      const block = normalizeEmbed(item);
      if (block) blocks.push(block);
      continue;
    }

    if (item.type === "related") {
      const block = normalizeRelated(item);
      if (block) blocks.push(block);
    }
  }

  return blocks;
}

export function legacyContentToBlocks(content?: string | null): BodyBlock[] {
  if (!content) return [];
  const lines = content
    .split(/\n{2,}/)
    .map((line) => line.trim())
    .filter(Boolean);

  const blocks: BodyBlock[] = [];

  for (const line of lines) {
    if (line.startsWith("## ")) {
      blocks.push({ type: "subhead", content: line.replace(/^##\s+/, "") });
      continue;
    }

    if (line.startsWith("> ")) {
      blocks.push({ type: "quote", content: line.replace(/^>\s+/, "") });
      continue;
    }

    if (line.includes("\n- ")) {
      const items = line
        .split(/\n/)
        .map((item) => item.replace(/^-\s*/, "").trim())
        .filter(Boolean);
      if (items.length) {
        blocks.push({ type: "list", items });
      }
      continue;
    }

    blocks.push({ type: "paragraph", content: line });
  }

  return blocks;
}

export function parseStoredBodyBlocks(contentBlocks?: string | null, legacyContent?: string | null) {
  if (contentBlocks) {
    try {
      const parsed = JSON.parse(contentBlocks);
      const normalized = normalizeBodyBlocks(parsed);
      if (normalized.length) {
        return normalized;
      }
    } catch {
      // Fall through to legacy parsing.
    }
  }

  return legacyContentToBlocks(legacyContent);
}

export function bodyBlocksToPlainText(blocks: BodyBlock[]) {
  return blocks
    .map((block) => {
      if (block.type === "list") {
        return block.items.join(" ");
      }

      if (block.type === "image") {
        return [block.alt, block.caption].filter(Boolean).join(" ");
      }

      if (block.type === "embed") {
        return [block.label, block.href].filter(Boolean).join(" ");
      }

      if (block.type === "related") {
        return [block.title, block.summary, block.href].filter(Boolean).join(" ");
      }

      if ("content" in block) {
        return block.content;
      }

      return "";
    })
    .filter(Boolean)
    .join(" ");
}

export function bodyBlocksToLegacyContent(blocks: BodyBlock[]) {
  return blocks
    .map((block) => {
      if (block.type === "paragraph") {
        return block.content;
      }

      if (block.type === "subhead") {
        return `## ${block.content}`;
      }

      if (block.type === "quote") {
        const attribution = block.attribution ? `\n— ${block.attribution}` : "";
        return `> ${block.content}${attribution}`;
      }

      if (block.type === "list") {
        return block.items.map((item) => `- ${item}`).join("\n");
      }

      if (block.type === "image") {
        return [block.caption, block.alt].filter(Boolean).join("\n");
      }

      if (block.type === "embed") {
        return [block.label || "Embedded reference", block.href].filter(Boolean).join("\n");
      }

      return [block.title, block.summary, block.href].filter(Boolean).join("\n");
    })
    .filter(Boolean)
    .join("\n\n");
}

export function serializeBodyBlocks(blocks: BodyBlock[]) {
  return JSON.stringify(blocks);
}
