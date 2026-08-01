export type LegacyDeskSlug =
  | "business"
  | "politics"
  | "entertainment"
  | "local-news"
  | "crime"
  | "transport"
  | "weather"
  | "sports";

type LegacyDeskConfig = {
  desk: LegacyDeskSlug;
  kind: "category" | "topic";
  sectionSlug: string;
};

type SectionLike = {
  slug?: string | null;
  parentId?: string | null;
  parentSlug?: string | null;
  parent?: {
    slug?: string | null;
  } | null;
};

export const legacyDeskConfigs = [
  { desk: "business", kind: "category", sectionSlug: "business" },
  { desk: "politics", kind: "category", sectionSlug: "politics" },
  { desk: "entertainment", kind: "category", sectionSlug: "culture" },
  { desk: "local-news", kind: "category", sectionSlug: "news" },
  { desk: "crime", kind: "topic", sectionSlug: "crime-courts" },
  { desk: "transport", kind: "category", sectionSlug: "transport" },
  { desk: "weather", kind: "topic", sectionSlug: "weather" },
  { desk: "sports", kind: "category", sectionSlug: "sport" }
] as const satisfies readonly LegacyDeskConfig[];

const legacyDeskConfigByDesk = new Map<LegacyDeskSlug, LegacyDeskConfig>(
  legacyDeskConfigs.map((config) => [config.desk, config])
);

function normalizeLegacyDesk(value?: string | null): LegacyDeskSlug | null {
  if (!value) return null;
  const match = legacyDeskConfigByDesk.get(value as LegacyDeskSlug);
  return match?.desk || null;
}

function sectionSlugs(section?: SectionLike | null) {
  return {
    slug: section?.slug || null,
    parentSlug: section?.parent?.slug || section?.parentSlug || null
  };
}

export function listLegacyDeskSlugs() {
  return legacyDeskConfigs.map((config) => config.desk);
}

export function getLegacyDeskConfig(desk?: string | null) {
  const normalized = normalizeLegacyDesk(desk);
  return normalized ? legacyDeskConfigByDesk.get(normalized) || null : null;
}

export function getLegacyDeskPath(desk?: string | null) {
  const normalized = normalizeLegacyDesk(desk);
  return normalized ? `/${normalized}` : null;
}

export function getLegacyDeskForSection(section?: SectionLike | null): LegacyDeskSlug | null {
  const { slug, parentSlug } = sectionSlugs(section);

  if (slug === "crime-courts") return "crime";
  if (slug === "weather") return "weather";
  if (slug === "business") return "business";
  if (slug === "politics") return "politics";
  if (slug === "culture") return "entertainment";
  if (slug === "news" || slug === "community") return "local-news";
  if (slug === "transport") return "transport";
  if (slug === "sport") return "sports";

  if (parentSlug === "business") return "business";
  if (parentSlug === "politics") return "politics";
  if (parentSlug === "culture") return "entertainment";
  if (parentSlug === "news") return "local-news";

  return null;
}

export function getLegacyCollectionPath(section?: SectionLike | null) {
  const desk = getLegacyDeskForSection(section);
  return desk ? `/${desk}` : null;
}

export function getPreferredArticlePath(params: {
  slug?: string | null;
  section?: SectionLike | null;
}) {
  const slug = params.slug || "";
  const desk = getLegacyDeskForSection(params.section);

  if (!slug) {
    return desk ? `/${desk}` : "/articles";
  }

  return desk ? `/${desk}/${slug}` : `/articles/${slug}`;
}

export function normalizeStoredArticlePath(path: string | null | undefined, slug?: string | null) {
  if (!path || !slug) return null;

  const trimmed = path.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed);
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return trimmed.startsWith("/") ? trimmed : null;
  }
}

export function shouldPreferLegacyArticlePath(params: {
  canonical?: string | null;
  slug?: string | null;
  section?: SectionLike | null;
}) {
  const slug = params.slug || "";
  if (!slug) return false;

  const preferredPath = getPreferredArticlePath({
    slug,
    section: params.section
  });
  const storedPath = normalizeStoredArticlePath(params.canonical, slug);

  if (!storedPath) {
    return preferredPath !== `/articles/${slug}`;
  }

  return storedPath === `/articles/${slug}` && preferredPath !== storedPath;
}

export function matchesLegacyDesk(section: SectionLike | null | undefined, desk?: string | null) {
  const normalized = normalizeLegacyDesk(desk);
  return normalized ? getLegacyDeskForSection(section) === normalized : false;
}
