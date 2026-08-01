import type { BodyBlock } from "./cms-types";
import { absoluteUrl, truncate } from "./cms/utils";
import {
  getSiteOrigin,
  SITE_DESCRIPTION,
  SITE_LANGUAGE,
  SITE_LOCALE,
  SITE_NAME,
  SITE_TWITTER_HANDLE
} from "./site";

type SeoInput = {
  title?: string;
  description?: string;
  image?: string;
  canonical?: string;
  type?: "website" | "article";
  noindex?: boolean;
  socialTitle?: string;
  socialDescription?: string;
  publishedTime?: string;
  modifiedTime?: string;
  authorName?: string;
  section?: string;
  keywords?: string[];
};

export function buildSeo(input: SeoInput) {
  const title = input.title || SITE_NAME;
  const description = input.description || SITE_DESCRIPTION;
  const image = input.image ? normalizeAbsoluteUrl(input.image) : undefined;
  const canonical = normalizeAbsoluteUrl(input.canonical || "/");
  const type = input.type || "website";
  const noindex = !!input.noindex;
  const socialTitle = input.socialTitle || title;
  const socialDescription = input.socialDescription || description;
  const keywords = dedupeStrings(input.keywords || []);

  return {
    title,
    description,
    image,
    canonical,
    type,
    noindex,
    socialTitle,
    socialDescription,
    publishedTime: input.publishedTime,
    modifiedTime: input.modifiedTime,
    authorName: input.authorName,
    section: input.section,
    keywords,
    siteName: SITE_NAME,
    locale: SITE_LOCALE,
    twitterSite: SITE_TWITTER_HANDLE
  };
}

export function normalizeAbsoluteUrl(input: string) {
  if (/^https?:\/\//i.test(input)) return input;
  return absoluteUrl(input.startsWith("/") ? input : `/${input}`);
}

export function dedupeStrings(values: string[]) {
  return Array.from(
    new Set(
      values
        .map((value) => value.trim())
        .filter(Boolean)
    )
  );
}

export function bodyBlocksToPlainText(blocks: BodyBlock[]) {
  return blocks
    .map((block) => {
      if (block.type === "paragraph" || block.type === "subhead" || block.type === "quote") {
        return block.content;
      }

      if (block.type === "list") {
        return block.items.join(" ");
      }

      if (block.type === "image") {
        return [block.caption, block.alt].filter(Boolean).join(" ");
      }

      return "";
    })
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

export function deriveArticleKeywords(input: {
  title: string;
  section: string;
  authorName?: string;
  slug: string;
}) {
  const title = input.title.trim();
  const section = input.section.trim();
  const authorName = input.authorName?.trim();

  return dedupeStrings([
    title,
    `${title} ${SITE_NAME}`,
    `${section} news`,
    `${section} London news`,
    `${section} headlines`,
    `${section} analysis`,
    "London news",
    input.slug.replace(/-/g, " "),
    authorName && authorName !== "London News Staff" ? authorName : ""
  ]).slice(0, 8);
}

export function buildWebsiteStructuredData(input?: {
  description?: string;
  image?: string;
}) {
  const origin = getSiteOrigin();
  const description = input?.description || SITE_DESCRIPTION;
  const image = input?.image ? normalizeAbsoluteUrl(input.image) : undefined;

  return {
    "@context": "https://schema.org",
    "@graph": [
      buildOrganizationGraphNode(origin),
      buildWebsiteGraphNode(origin, description, image)
    ]
  };
}

export function buildBreadcrumbStructuredData(input: {
  url: string;
  items: Array<{ name: string; item: string }>;
}) {
  return {
    "@type": "BreadcrumbList",
    "@id": `${input.url}#breadcrumb`,
    itemListElement: input.items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.item
    }))
  };
}

export function buildCollectionPageStructuredData(input: {
  url: string;
  name: string;
  description: string;
  image?: string;
  breadcrumbs: Array<{ name: string; item: string }>;
}) {
  const origin = getSiteOrigin();

  return {
    "@context": "https://schema.org",
    "@graph": [
      buildOrganizationGraphNode(origin),
      buildWebsiteGraphNode(origin),
      {
        "@type": "CollectionPage",
        "@id": `${input.url}#collection`,
        url: input.url,
        name: input.name,
        description: input.description,
        inLanguage: SITE_LANGUAGE,
        isPartOf: { "@id": `${origin}/#website` },
        image: input.image ? normalizeAbsoluteUrl(input.image) : undefined
      },
      buildBreadcrumbStructuredData({
        url: input.url,
        items: input.breadcrumbs
      })
    ]
  };
}

export function buildArticleStructuredData(input: {
  url: string;
  title: string;
  description: string;
  image?: string;
  publishedTime: string;
  modifiedTime: string;
  authorName: string;
  sectionName: string;
  bodyBlocks: BodyBlock[];
  keywords: string[];
  breadcrumbs: Array<{ name: string; item: string }>;
}) {
  const origin = getSiteOrigin();
  const bodyText = bodyBlocksToPlainText(input.bodyBlocks);

  return {
    "@context": "https://schema.org",
    "@graph": [
      buildOrganizationGraphNode(origin),
      buildWebsiteGraphNode(origin),
      {
        "@type": "NewsArticle",
        "@id": `${input.url}#newsarticle`,
        mainEntityOfPage: {
          "@type": "WebPage",
          "@id": input.url
        },
        url: input.url,
        headline: input.title,
        alternativeHeadline: truncate(input.description, 110),
        description: input.description,
        image: input.image ? [normalizeAbsoluteUrl(input.image)] : undefined,
        datePublished: input.publishedTime,
        dateModified: input.modifiedTime,
        author: {
          "@type": "Person",
          name: input.authorName
        },
        publisher: {
          "@id": `${origin}/#organization`
        },
        articleSection: input.sectionName,
        keywords: input.keywords,
        inLanguage: SITE_LANGUAGE,
        isAccessibleForFree: true,
        wordCount: bodyText ? bodyText.split(/\s+/).filter(Boolean).length : undefined,
        articleBody: bodyText || undefined
      },
      buildBreadcrumbStructuredData({
        url: input.url,
        items: input.breadcrumbs
      })
    ]
  };
}

function buildOrganizationGraphNode(origin: string) {
  return {
    "@type": "Organization",
    "@id": `${origin}/#organization`,
    name: SITE_NAME,
    url: origin,
    logo: {
      "@type": "ImageObject",
      url: `${origin}/london-news-logo.svg`,
      width: 600,
      height: 60
    }
  };
}

function buildWebsiteGraphNode(origin: string, description = SITE_DESCRIPTION, image?: string) {
  return {
    "@type": "WebSite",
    "@id": `${origin}/#website`,
    url: origin,
    name: SITE_NAME,
    description,
    inLanguage: SITE_LANGUAGE,
    publisher: { "@id": `${origin}/#organization` },
    image
  };
}
