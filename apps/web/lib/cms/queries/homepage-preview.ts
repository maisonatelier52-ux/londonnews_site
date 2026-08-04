import { prisma } from "../../../utils/prisma";
import { parseJsonField } from "../../../utils/json";
import type { HeadlineItem, HomepageView } from "../../cms-types";
import { buildHomepagePreviewUrl } from "../../admin/homepage-workflow";
import { getHomepageClassifiedItems } from "./classifieds";
import { getDynamicTopNav } from "./navigation";
import { defaultHomepageSettings, mapArticleToStoryCard } from "../utils";
import { getPreferredArticlePath } from "../../legacy-routes";

type SnapshotSection = {
  key: string;
  kind: string;
  title?: string | null;
  position: number;
  settings?: any;
  slots: Array<{
    position: number;
    articleId?: string | null;
    titleOverride?: string | null;
    excerptOverride?: string | null;
    imageOverride?: string | null;
    hrefOverride?: string | null;
    kickerOverride?: string | null;
    settings?: any;
  }>;
};

type Snapshot = {
  title: string;
  slug: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoImage?: string | null;
  settings?: any;
  sections: SnapshotSection[];
};

function resolveGoodNewsTitle(title?: string | null) {
  const value = title?.trim();
  if (!value) return "First, the good news";
  if (value.toLowerCase() === "lead story") return "First, the good news";
  return value;
}

export async function getHomepagePreviewByToken(token: string): Promise<{ homepage: HomepageView; version: any } | null> {
  const version = await prisma.homepageVersion.findUnique({
    where: { previewToken: token },
  });

  if (!version) return null;

  const snapshot = parseJsonField<Snapshot>(version.snapshot, {
    title: "Homepage preview",
    slug: "homepage-preview",
    settings: defaultHomepageSettings(),
    sections: [],
  });
  const articleIds = (snapshot.sections || [])
    .flatMap((section) => section.slots || [])
    .map((slot) => slot.articleId)
    .filter(Boolean) as string[];

  const articles = await prisma.article.findMany({
    where: { id: { in: articleIds } },
    include: {
      seo: true,
      section: {
        include: {
          parent: true
        }
      },
    },
  });

  const byId = new Map(articles.map((article) => [article.id, article]));
  const settings = { ...defaultHomepageSettings(), ...((snapshot.settings as any) || {}) };
  const dynamicNav = await getDynamicTopNav();
  const liveClassifieds = await getHomepageClassifiedItems();
  const byKey = new Map((snapshot.sections || []).map((section) => [section.key, section]));

  const leadStorySection = byKey.get("leadStory");
  const leadStorySlots = leadStorySection?.slots || [];
  const leadStorySlot = leadStorySlots[0];
  const secondFeatureSlot = byKey.get("secondFeature")?.slots?.[0];
  const goodNewsStories = leadStorySlots.map((slot) =>
    mapArticleToStoryCard(byId.get(slot.articleId || ""), slot)
  );

  const supportingStories = (byKey.get("supportingStories")?.slots || [])
    .map((slot) => mapArticleToStoryCard(byId.get(slot.articleId || ""), slot));

  const tertiaryStories = (byKey.get("tertiaryStories")?.slots || [])
    .map((slot) => mapArticleToStoryCard(byId.get(slot.articleId || ""), slot));

  const topHeadlines: HeadlineItem[] = (byKey.get("topHeadlines")?.slots || []).map((slot, index) => {
    const article = byId.get(slot.articleId || "");
    return {
      id: `${slot.articleId || "headline"}-${index}`,
      title: slot.titleOverride || article?.title || `Headline ${index + 1}`,
      summary: slot.excerptOverride || article?.excerpt || article?.dek || "Preview headline item.",
      href:
        slot.hrefOverride ||
        getPreferredArticlePath({
          slug: article?.seo?.slug || article?.id || "",
          section: article?.section
        }),
    };
  });

  const homepage: HomepageView = {
    ...settings,
    nav: dynamicNav.length > 0 ? dynamicNav : settings.nav,
    classifieds: liveClassifieds.length > 0 ? liveClassifieds : settings.classifieds,
    goodNewsTitle: resolveGoodNewsTitle(leadStorySection?.title),
    goodNewsStories,
    leadStory: leadStorySlot
      ? mapArticleToStoryCard(byId.get(leadStorySlot.articleId || ""), leadStorySlot)
      : {
          id: "preview-missing-lead",
          section: "News",
          title: "No lead story selected in this draft.",
          excerpt: "Choose a lead story in the homepage workflow editor.",
          href: "/admin/homepage",
          readLabel: "Back to editor",
        },
    secondFeature: secondFeatureSlot
      ? mapArticleToStoryCard(byId.get(secondFeatureSlot.articleId || ""), secondFeatureSlot)
      : {
          id: "preview-missing-feature",
          section: "News",
          title: "No second feature selected in this draft.",
          excerpt: "Choose a featured story in the homepage workflow editor.",
          href: "/admin/homepage",
          readLabel: "Back to editor",
        },
    supportingStories,
    tertiaryStories,
    topHeadlines,
    seo: {
      title: snapshot.seoTitle || snapshot.title || "Homepage preview",
      description: snapshot.seoDescription || "Preview of the London News homepage draft.",
      image: snapshot.seoImage || (leadStorySlot ? byId.get(leadStorySlot.articleId || "")?.heroImage : null) || null,
    },
  };

  return {
    homepage,
    version: {
      ...version,
      previewUrl: buildHomepagePreviewUrl(version.previewToken),
    },
  };
}