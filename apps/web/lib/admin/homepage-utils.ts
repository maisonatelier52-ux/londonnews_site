import { defaultHomepageSettings } from "../cms/utils";
import { parseJsonField } from "../../utils/json";
import { canManageUsers, isEditorialRole } from "../../utils/auth";

export const SECTION_PRESETS = [
  { key: "leadStory", kind: "LEAD_STORY", label: "First, the good news" },
  { key: "supportingStories", kind: "SUPPORTING_STORIES", label: "Supporting stories" },
  { key: "secondFeature", kind: "FEATURE", label: "Second feature" },
  { key: "tertiaryStories", kind: "TERTIARY_STORIES", label: "Tertiary stories" },
  { key: "topHeadlines", kind: "HEADLINE_STACK", label: "Top headlines" },
  { key: "communityServices", kind: "COMMUNITY_SERVICES", label: "Community services" },
  { key: "customSection", kind: "CUSTOM", label: "Custom section" },
] as const;

export const KIND_OPTIONS = [
  "LEAD_STORY",
  "SUPPORTING_STORIES",
  "FEATURE",
  "TERTIARY_STORIES",
  "HEADLINE_STACK",
  "COMMUNITY_SERVICES",
  "CUSTOM",
] as const;

export type AdminHomepageSlot = {
  id?: string;
  position: number;
  articleId?: string | null;
  article?: {
    id: string;
    title: string;
    section?: { name?: string | null; slug?: string | null } | null;
    seo?: { slug?: string | null } | null;
    heroImage?: string | null;
  } | null;
  titleOverride?: string | null;
  excerptOverride?: string | null;
  imageOverride?: string | null;
  hrefOverride?: string | null;
  kickerOverride?: string | null;
  settings?: any;
};

export type AdminHomepageSection = {
  id?: string;
  key: string;
  kind: string;
  title?: string | null;
  position: number;
  settings?: any;
  slots: AdminHomepageSlot[];
};

export type AdminHomepage = {
  id: string;
  slug: string;
  title: string;
  isActive: boolean;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoImage?: string | null;
  settings?: any;
  sections: AdminHomepageSection[];
  updatedAt?: string;
};

export function slugifyLite(input: string) {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function createDefaultSectionPreset(presetKey = "customSection", position = 1): AdminHomepageSection {
  const preset = SECTION_PRESETS.find((item) => item.key === presetKey) || SECTION_PRESETS[SECTION_PRESETS.length - 1];
  return {
    key: preset.key,
    kind: preset.kind,
    title: preset.label,
    position,
    settings: {},
    slots: [],
  };
}

export function createEmptySlot(position = 1): AdminHomepageSlot {
  return {
    position,
    articleId: null,
    titleOverride: "",
    excerptOverride: "",
    imageOverride: "",
    hrefOverride: "",
    kickerOverride: "",
    settings: {},
  };
}

export function buildDefaultHomepagePayload(title = "Homepage") {
  const settings = defaultHomepageSettings();
  const sections = [
    createDefaultSectionPreset("leadStory", 1),
    createDefaultSectionPreset("supportingStories", 2),
    createDefaultSectionPreset("secondFeature", 3),
    createDefaultSectionPreset("tertiaryStories", 4),
    createDefaultSectionPreset("topHeadlines", 5),
  ];

  return {
    title,
    slug: slugifyLite(title) || `homepage-${Date.now()}`,
    seoTitle: "London News",
    seoDescription: "The London News front page.",
    seoImage: "",
    settings,
    sections,
  };
}

export function prettyJson(input: any) {
  return JSON.stringify(input ?? defaultHomepageSettings(), null, 2);
}

export function safeJsonParse(text: string, fallback: any = {}) {
  try {
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}

export function hydrateHomepage(homepage: any): AdminHomepage | null {
  if (!homepage) return null;

  return {
    ...homepage,
    settings: parseJsonField(homepage.settings, defaultHomepageSettings()),
    sections: (homepage.sections || []).map((section: any) => ({
      ...section,
      settings: parseJsonField(section.settings, {}),
      slots: (section.slots || []).map((slot: any) => ({
        ...slot,
        settings: parseJsonField(slot.settings, {})
      }))
    }))
  };
}

export function hydrateHomepageVersion(version: any) {
  return {
    ...version,
    snapshot: parseJsonField(version.snapshot, {})
  };
}

export function normalizeSections(sections: AdminHomepageSection[]) {
  return sections.map((section, sectionIndex) => ({
    ...section,
    position: sectionIndex + 1,
    slots: (section.slots || []).map((slot, slotIndex) => ({
      ...slot,
      position: slotIndex + 1,
    })),
  }));
}

export function canManageHomepage(role?: string) {
  return isEditorialRole(role);
}

export function canDeleteHomepage(role?: string) {
  return canManageUsers(role);
}
