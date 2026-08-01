import type { ArticleView, CategoryView, HomepageView } from "./cms-types";
import { articlePageData, categoryPageData } from "./editorial-data";
import { homepageData } from "./homepage-data";
import { slugify } from "../utils/slug";
import { getSectionPath } from "./taxonomy";

export function getFallbackHomepage(): HomepageView {
  return {
    ...homepageData,
    seo: {
      title: "London News",
      description:
        "A modern London newsroom homepage rebuilt in a legacy-newspaper visual system.",
      image: homepageData.leadStory.image
    }
  };
}

export function getFallbackArticle(): ArticleView {
  return {
    ...articlePageData,
    sectionSlug: slugify(articlePageData.section),
    sectionHref: getSectionPath({ slug: slugify(articlePageData.section) }),
    correctionNotes: [],
    seo: {
      title: `${articlePageData.title} | London News`,
      description: articlePageData.dek,
      image: articlePageData.heroImage,
      canonical: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/articles/${articlePageData.slug}`,
      noindex: false,
      socialTitle: articlePageData.title,
      socialDescription: articlePageData.dek
    }
  };
}

export function getFallbackCategory(): CategoryView {
  return {
    kind: "category",
    ...categoryPageData,
    href: getSectionPath({ slug: categoryPageData.slug }),
    parent: null,
    childTopics: [],
    siblingTopics: [],
    articleCount: 7,
    seo: {
      title: `${categoryPageData.name} | London News`,
      description: categoryPageData.description,
      image: categoryPageData.leadStory.image
    }
  };
}
