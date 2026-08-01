import type { TaxonomyLink } from "./cms-types";

type SectionRouteInput = {
  slug?: string | null;
  name?: string | null;
  navLabel?: string | null;
  description?: string | null;
  parentSlug?: string | null;
  parentId?: string | null;
  parent?: {
    slug?: string | null;
  } | null;
  _count?: {
    articles?: number;
  };
};

const dedicatedSectionRoutes: Record<string, string> = {
  classifieds: "/classifieds"
};

export function isTopicSection(section?: SectionRouteInput | null) {
  return Boolean(section?.parentId || section?.parent?.slug || section?.parentSlug);
}

export function getSectionPath(section?: SectionRouteInput | null) {
  const slug = section?.slug || "news";
  const dedicatedRoute = dedicatedSectionRoutes[slug];

  if (dedicatedRoute) {
    return dedicatedRoute;
  }

  return isTopicSection(section) ? `/topics/${slug}` : `/category/${slug}`;
}

export function toTaxonomyLink(section?: SectionRouteInput | null): TaxonomyLink {
  return {
    name: section?.name || section?.navLabel || "News",
    slug: section?.slug || "news",
    href: getSectionPath(section),
    navLabel: section?.navLabel || undefined,
    description: section?.description || undefined,
    articleCount: section?._count?.articles
  };
}
