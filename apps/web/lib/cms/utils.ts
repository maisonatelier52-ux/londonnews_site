import type { BodyBlock, StoryCardData } from "../cms-types";
import { homepageClassifiedItems } from "../classifieds-data";
import { defaultTopNavItems } from "../categories/recommended-categories";
import { defaultMoodBreakdown, defaultMoodOptions } from "../mood";
import { bodyBlocksToPlainText, legacyContentToBlocks, parseStoredBodyBlocks } from "../articles/blocks";
import { getPreferredArticlePath } from "../legacy-routes";

export function stripHtml(input?: string | null) {
  return (input || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export function truncate(input: string, max = 160) {
  if (input.length <= max) return input;
  return input.slice(0, max).trimEnd() + "…";
}

export function contentToBlocks(content?: string | null): BodyBlock[] {
  return legacyContentToBlocks(content);
}

export function summarizeBodyBlocks(blocks: BodyBlock[]) {
  return bodyBlocksToPlainText(blocks);
}

export function absoluteUrl(path = "/") {
  const origin = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return `${origin.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

export function mapArticleToStoryCard(article: any, overrides?: any): StoryCardData {
  const slug = article?.seo?.slug || article?.slug || article?.id;
  const href =
    overrides?.hrefOverride ||
    getPreferredArticlePath({
      slug,
      section: article?.section
    });
  const rawExcerpt =
    overrides?.excerptOverride ||
    article?.excerpt ||
    article?.dek ||
    stripHtml(
      article?.contentBlocks
        ? summarizeBodyBlocks(parseStoredBodyBlocks(article?.contentBlocks, article?.content))
        : article?.content
    );

  return {
    id: overrides?.id || article?.id || slug,
    section: article?.section?.name || article?.section?.slug || article?.section || "News",
    title: overrides?.titleOverride || article?.title || "Untitled story",
    excerpt: truncate(rawExcerpt || "No summary available.", 180),
    href,
    image: overrides?.imageOverride || article?.heroImage || article?.seo?.socialImage || null,
    kicker: overrides?.kickerOverride || null,
    readLabel: overrides?.readLabel || "Read more",
  };
}

export function defaultHomepageSettings() {
  return {
    betaLabel: "Beta Release",
    mastheadLine: "KEEP CALM. HERE'S THE GOOD NEWS.",
    mastheadTop: "London",
    mastheadBottom: "News",
    nav: defaultTopNavItems,
    utilityLinks: [
      { label: "Customise", href: "/customise" },
      { label: "Subscribe", href: "/subscribe" },
    ],
    forecastTabs: ["Forecast", "Today", "Tomorrow", "This Weekend"],
    moodOptions: defaultMoodOptions(),
    moodUpdatedText: "Updated recently",
    moodHeadline: "London is okay right now",
    moodBreakdown: defaultMoodBreakdown(),
    surveyTitle: "Take part in our daily survey",
    surveyButtonLabel: "Take survey",
    surveySuccessText: "Thanks. Check back tomorrow for the next pulse.",
    socialCalendarTitle: "Social calendar",
    subscribeTitle: "Subscribe",
    subscribeBody:
      "Become a member for premium reads, local briefings, and a cleaner experience with faster access to our best journalism.",
    eventsAreaLabel: "Events in your area",
    events: [
      { category: "Breakfast Club", time: "10 AM", title: "Investment opportunities" },
      { category: "Charity", time: "3 PM", title: "Fundraiser for children’s hospital" },
      { category: "Community", time: "6 PM", title: "West London local business mixer" },
    ],
    classifieds: homepageClassifiedItems,
  };
}