import { prisma } from "../../../utils/prisma";
import type { HeadlineItem, HomepageView } from "../../cms-types";
import { parseJsonField } from "../../../utils/json";
import { getHomepageClassifiedItems } from "./classifieds";
import { buildMoodWidgetView } from "./mood";
import { getDynamicTopNav } from "./navigation";
import { defaultHomepageSettings, mapArticleToStoryCard } from "../utils";
import { getPreferredArticlePath } from "../../legacy-routes";
import { logEvent } from "../../server/logger";

type HomepageRecord = Awaited<ReturnType<typeof prisma.homepage.findFirst>>;

function resolveGoodNewsTitle(title?: string | null) {
  const value = title?.trim();
  if (!value) return "First, the good news";
  if (value.toLowerCase() === "lead story") return "First, the good news";
  return value;
}

export async function getActiveHomepageData(): Promise<HomepageView | null> {
  try {
    const homepage = await prisma.homepage.findFirst({
      where: { isActive: true },
      include: {
        sections: {
          orderBy: { position: "asc" },
          include: {
            slots: {
              orderBy: { position: "asc" },
              include: {
                article: {
                  include: {
                    seo: true,
                    section: {
                      include: {
                        parent: true
                      }
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!homepage) return null;

    const settings = {
      ...defaultHomepageSettings(),
      ...parseJsonField(homepage.settings, defaultHomepageSettings())
    };
    const dynamicNav = await getDynamicTopNav();
    const liveClassifieds = await getHomepageClassifiedItems();
    const moodWidget = await buildMoodWidgetView({
      homepageId: homepage.id,
      settings
    });

    const byKey = new Map(homepage.sections.map((section) => [section.key, section]));

    const leadStorySection = byKey.get("leadStory");
    const leadStorySlots = leadStorySection?.slots || [];
    const leadStory = leadStorySlots[0];
    const secondFeature = byKey.get("secondFeature")?.slots?.[0];
    const goodNewsStories = leadStorySlots.map((slot) =>
      mapArticleToStoryCard(slot.article, slot)
    );

    const supportingStories = (byKey.get("supportingStories")?.slots || []).map((slot) =>
      mapArticleToStoryCard(slot.article, slot)
    );

    const tertiaryStories = (byKey.get("tertiaryStories")?.slots || []).map((slot) =>
      mapArticleToStoryCard(slot.article, slot)
    );

    const topHeadlines: HeadlineItem[] = (byKey.get("topHeadlines")?.slots || []).map((slot, index) => ({
      id: slot.id,
      title: slot.titleOverride || slot.article?.title || `Headline ${index + 1}`,
      summary:
        slot.excerptOverride ||
        slot.article?.excerpt ||
        slot.article?.dek ||
        "Editor-curated short headline module.",
      href:
        slot.hrefOverride ||
        getPreferredArticlePath({
          slug: slot.article?.seo?.slug || slot.article?.id,
          section: slot.article?.section
        }),
    }));

    return {
      ...settings,
      ...moodWidget,
      nav: dynamicNav.length > 0 ? dynamicNav : settings.nav,
      classifieds: liveClassifieds.length > 0 ? liveClassifieds : settings.classifieds,
      goodNewsTitle: resolveGoodNewsTitle(leadStorySection?.title),
      goodNewsStories,
      leadStory: leadStory ? mapArticleToStoryCard(leadStory.article, leadStory) : {
        id: "missing-lead",
        section: "News",
        title: "Choose a lead story in the homepage admin.",
        excerpt: "Seed or configure the active homepage to replace this placeholder.",
        href: "/admin",
        readLabel: "Open admin",
      },
      supportingStories,
      secondFeature: secondFeature ? mapArticleToStoryCard(secondFeature.article, secondFeature) : {
        id: "missing-feature",
        section: "News",
        title: "Choose a featured story in the homepage admin.",
        excerpt: "Add a `secondFeature` slot to your homepage configuration.",
        href: "/admin",
        readLabel: "Open admin",
      },
      tertiaryStories,
      topHeadlines,
      seo: {
        title: homepage.seoTitle || "London News",
        description:
          homepage.seoDescription ||
          "A modern London newsroom homepage rebuilt in a legacy-newspaper visual system.",
        image: homepage.seoImage || (leadStory?.article?.heroImage ?? undefined),
      },
    };
  } catch (error) {
    logEvent("error", "homepage.query_failed", { error });
    throw error;
  }
}
