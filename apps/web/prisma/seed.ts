import { hash } from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { classifiedListings } from "../lib/classifieds-data";
import { recommendedCategories } from "../lib/categories/recommended-categories";
import { articlePageData, categoryPageData } from "../lib/editorial-data";
import { legacyContentToBlocks, serializeBodyBlocks } from "../lib/articles/blocks";
import type { BodyBlock } from "../lib/cms-types";
import { homepageData } from "../lib/homepage-data";
import { defaultHomepageSettings } from "../lib/cms/utils";
import { getMoodSurveyDay } from "../lib/mood";
import { stringifyJsonField } from "../utils/json";
import { slugify } from "../utils/slug";

const prisma = new PrismaClient();
const DEMO_PASSWORD = "LondonNews123!";

type SeedUserRole = "JMHV" | "SUPERADMIN" | "EDITOR" | "JOURNALIST" | "GUEST_WRITER";

const DEMO_USERS: Array<{
  email: string;
  name: string;
  role: SeedUserRole;
  bio: string;
  avatar?: string;
}> = [
  {
    email: "superadmin@londonnews.local",
    name: "Martha Cole",
    role: "SUPERADMIN",
    bio: "Runs the London News platform, team permissions, and newsroom operations."
  },
  {
    email: "jmhv@londonnews.local",
    name: "JMHV",
    role: "JMHV",
    bio: "Owner-level account for final approvals, user management, and executive newsroom review."
  },
  {
    email: "editor1@londonnews.local",
    name: "Daniel Ross",
    role: "EDITOR",
    bio: "Front-page editor overseeing homepage curation and publication workflow."
  },
  {
    email: "editor2@londonnews.local",
    name: "Priya Shah",
    role: "EDITOR",
    bio: "News editor coordinating desks, homepage timing, and line edits across the report."
  },
  {
    email: "journalist1@londonnews.local",
    name: "Amelia Hart",
    role: "JOURNALIST",
    bio: articlePageData.author.bio,
    avatar: articlePageData.author.avatar
  },
  {
    email: "journalist2@londonnews.local",
    name: "Theo Bennett",
    role: "JOURNALIST",
    bio: "City reporter covering policy, transport, and accountability beats across London."
  },
  {
    email: "guestwriter1@londonnews.local",
    name: "Aisha Khan",
    role: "GUEST_WRITER",
    bio: "Guest writer account for drafting and submitting stories into review."
  },
  {
    email: "guestwriter2@londonnews.local",
    name: "Leila Moore",
    role: "GUEST_WRITER",
    bio: "Guest writer login for opinion, culture, and community desk submissions."
  }
];

const LEGACY_DEMO_EMAILS = [
  "editor@londonnews.local",
  "writer@londonnews.local",
  "reporter@londonnews.local"
];

type SeedStory = {
  slug: string;
  title: string;
  section: string;
  excerpt: string;
  dek: string;
  image?: string | null;
  heroAlt?: string;
  authorEmail: string;
  content: string;
  contentBlocks?: BodyBlock[];
  status?: "DRAFT" | "IN_REVIEW" | "APPROVED" | "REJECTED";
  publishedAt?: Date | null;
  viewCount?: number;
};

type SeedClassified = {
  slug: string;
  category: string;
  title: string;
  price: string;
  location: string;
  summary: string;
  description: string;
  image?: string;
  sellerName: string;
  sellerEmail: string;
  sellerPhone?: string;
  featured?: boolean;
  status: "DRAFT" | "IN_REVIEW" | "APPROVED" | "REJECTED";
  submittedAt?: Date | null;
  publishedAt?: Date | null;
  expiresAt?: Date | null;
  reviewNotes?: string | null;
  submittedByEmail?: string | null;
};

function hrefToSlug(href: string) {
  return href.split("/").filter(Boolean).pop() || slugify(href);
}

function bodyToContent() {
  return articlePageData.body
    .map((block) => {
      if (block.type === "subhead") return `## ${block.content}`;
      if (block.type === "quote") return `> ${block.content}`;
      if (block.type === "list") return block.items.map((item) => `- ${item}`).join("\n");
      if (block.type === "image") return block.caption || block.alt;
      return block.content;
    })
    .join("\n\n");
}

function buildGenericBlocks(story: { title: string; excerpt: string; section: string }): BodyBlock[] {
  return [
    {
      type: "paragraph",
      content: `${story.excerpt} Editors can expand this seeded story with reporting updates, source material, and desk-specific framing as coverage develops.`
    },
    {
      type: "subhead",
      content: `${story.section} desk context`
    },
    {
      type: "paragraph",
      content: `The ${story.section} desk is seeded with structured article blocks so the newsroom can exercise authoring, preview, search, and revision history from the first local boot.`
    },
    {
      type: "quote",
      content: "Early seeded coverage should read like a usable local news report, not like implementation filler.",
      attribution: "London News editorial template"
    },
    {
      type: "list",
      items: [
        "Confirm the editorial angle and source notes",
        "Add reporting updates or desk-specific context",
        "Publish, schedule, or return the story for edits"
      ]
    }
  ];
}

function buildGenericContent(story: { title: string; excerpt: string; section: string }) {
  return bodyBlocksToText(buildGenericBlocks(story));
}

const goodNewsStoryDetails = {
  "lewis-capaldi-bst-hyde-park-livestream": {
    dek: "Lewis Capaldi's Hyde Park return is set to reach far beyond the ticket line, with a free global livestream turning a London headline gig into a shared summer event.",
    heroAlt: "Concert crowd with phones raised during an outdoor performance",
    authorEmail: "editor1@londonnews.local",
    publishedAt: new Date("2026-07-11T18:30:00.000Z"),
    viewCount: 1240,
    sourceName: "The Scottish Sun",
    sourceUrl: "https://www.thescottishsun.co.uk/tvandshowbiz/16509546/lewis-capaldi-london-gig-streamed-live-youtube-hyde-park/",
    paragraphs: [
      "Lewis Capaldi's BST Hyde Park date has become good news for more than just the crowd inside the gates, with organisers making the show available to watch live around the world on Saturday night.",
      "For London, that turns one of the capital's biggest summer music fixtures into a much wider civic moment. A sold-out park show still feels local on the ground, but the livestream gives the city an event that can travel well beyond the venue itself.",
      "It is the kind of upbeat, accessible culture story a summer homepage needs: a major artist, a recognisable London setting, and a free way for people to join in even if they are following along from home."
    ]
  },
  "bayeux-tapestry-british-museum-london-loan": {
    dek: "A rare Bayeux Tapestry loan would hand London one of the most significant museum draws in the city's cultural calendar.",
    heroAlt: "Visitors walking through a museum gallery in London",
    authorEmail: "journalist1@londonnews.local",
    publishedAt: new Date("2026-07-10T09:00:00.000Z"),
    viewCount: 980,
    sourceName: "The Guardian",
    sourceUrl: "https://www.theguardian.com/world/2026/jul/10/bayeux-tapestry-arrives-british-museum-exhibition",
    paragraphs: [
      "London is set for a major museum moment with the Bayeux Tapestry due to be shown at the British Museum in what is being treated as a rare and high-profile loan.",
      "The significance goes beyond a single exhibition slot. When a work of that historical weight lands in the capital, it resets the cultural conversation for months and gives residents and visitors a compelling reason to spend time in the city.",
      "For London News readers, it is straightforward good news: a world-class object, a familiar public institution, and another reminder that the capital remains one of the strongest places in Europe to encounter major art and history in person."
    ]
  },
  "barbican-veggery-pavilion-london": {
    dek: "The Barbican's new Veggery pavilion blends architecture, urban growing, and public curiosity into one of the capital's more optimistic design stories this month.",
    heroAlt: "Glasshouse plants inside a bright modern pavilion",
    authorEmail: "journalist2@londonnews.local",
    publishedAt: new Date("2026-07-08T12:15:00.000Z"),
    viewCount: 860,
    sourceName: "Wallpaper",
    sourceUrl: "https://www.wallpaper.com/architecture/architecture-events/the-veggery-greenhouse-pavilion-london-uk",
    paragraphs: [
      "The Barbican's new Veggery pavilion is the kind of cheerful London project that works on multiple levels at once: it is visually striking, practical, and easy to understand as a public-facing idea.",
      "The installation pulls food growing and greenhouse thinking into a high-profile architecture setting, which makes it feel more generous than a standard design intervention. It gives the city something lively to look at while also showing how everyday urban spaces can be reimagined.",
      "That combination of design value and public usefulness is what makes it strong homepage material. It is a London story about invention, access, and culture without any heavy explanation needed."
    ]
  },
  "bonsai-treehouse-exhibition-london-summer": {
    dek: "A bonsai treehouse exhibition running through August gives London a fresh family-friendly design stop for the summer.",
    heroAlt: "Miniature tree display framed by warm summer light",
    authorEmail: "editor2@londonnews.local",
    publishedAt: new Date("2026-07-04T11:00:00.000Z"),
    viewCount: 790,
    sourceName: "Wallpaper",
    sourceUrl: "https://www.wallpaper.com/architecture/architecture-events/bonsai-treehouse-exhibition-london-uk",
    paragraphs: [
      "A bonsai treehouse exhibition now running in London adds a small-scale, slightly magical stop to the city's summer calendar, with enough design interest to attract adults and enough curiosity to pull in families.",
      "The appeal here is its sense of discovery. London does not need every good-news story to be huge or headline-grabbing; sometimes a seasonal exhibition with a strong visual hook is exactly what makes the city feel more generous and worth exploring.",
      "Because it runs through the end of August, it also has staying power. Readers can actually act on the story, plan a visit, and treat it as one of those distinctive little London outings that define a summer in the city."
    ]
  },
  "summer-splash-royal-victoria-dock-return": {
    dek: "Summer Splash is returning to Royal Victoria Dock with another free run, giving Londoners a simple and unusually scenic way to get outside later this month.",
    heroAlt: "London skyline and water under summer light",
    authorEmail: "editor1@londonnews.local",
    publishedAt: new Date("2026-07-03T08:45:00.000Z"),
    viewCount: 745,
    sourceName: "The Sun",
    sourceUrl: "https://www.thesun.co.uk/travel/39390954/gorgeous-english-lido-sweeping-city-views-returns-free/",
    paragraphs: [
      "Summer Splash is coming back to Royal Victoria Dock from late July, bringing back one of London's more unusual warm-weather rituals: an outdoor swim with skyline views and no ticket price attached.",
      "That matters because genuinely free summer activities in the capital can still feel hard to come by, especially ones that look this distinctive. The dock setting gives the event a recognisable London identity rather than the feel of a generic seasonal pop-up.",
      "It is exactly the kind of practical good news that belongs high on the homepage. People can put a date in the diary, make a cheap day of it, and feel that the city is offering something open, public, and fun."
    ]
  },
  "queen-elizabeth-ii-garden-regents-park-opens": {
    dek: "The new Queen Elizabeth II Garden adds another accessible green corner to central London and gives Regent's Park a fresh public destination.",
    heroAlt: "Green public garden with flowers and walking paths",
    authorEmail: "journalist1@londonnews.local",
    publishedAt: new Date("2026-04-27T10:00:00.000Z"),
    viewCount: 702,
    sourceName: "The Guardian",
    sourceUrl: "https://www.theguardian.com/environment/2026/apr/18/a-prickle-of-hedgehogs-and-an-armada-of-newts-wildlife-settles-in-at-londons-new-queen-elizabeth-garden",
    paragraphs: [
      "The opening of the Queen Elizabeth II Garden in Regent's Park is quieter than a concert or blockbuster exhibition, but it is still some of the best kind of London news: more public green space, more habitat, and another corner of the city that people can simply go and enjoy.",
      "Openings like this matter because they improve the city in a durable way. A new public garden becomes part of everyday London life, whether that means lunchtime walks, family visits, or a calmer route through the park.",
      "It also rounds out this good-news package with something lasting. Not every positive story has to be time-limited; some are about London becoming a slightly better place to spend time in."
    ]
  }
} as const;

function buildGoodNewsBlocks(slug: keyof typeof goodNewsStoryDetails): BodyBlock[] {
  const story = goodNewsStoryDetails[slug];

  return [
    ...story.paragraphs.map((content) => ({
      type: "paragraph" as const,
      content
    })),
    {
      type: "embed" as const,
      href: story.sourceUrl,
      label: `Source: ${story.sourceName}`
    }
  ];
}

function bodyBlocksToText(blocks: BodyBlock[]) {
  return blocks
    .map((block) => {
      if (block.type === "paragraph") return block.content;
      if (block.type === "subhead") return `## ${block.content}`;
      if (block.type === "quote") {
        return block.attribution ? `> ${block.content}\n— ${block.attribution}` : `> ${block.content}`;
      }
      if (block.type === "list") return block.items.map((item) => `- ${item}`).join("\n");
      if (block.type === "image") return [block.caption, block.alt].filter(Boolean).join("\n");
      if (block.type === "embed") return [block.label || "External reference", block.href].filter(Boolean).join("\n");
      return [block.title, block.summary, block.href].filter(Boolean).join("\n");
    })
    .filter(Boolean)
    .join("\n\n");
}

async function upsertUser(params: {
  email: string;
  name: string;
  role: SeedUserRole;
  bio: string;
  avatar?: string;
}) {
  const passwordHash = await hash(DEMO_PASSWORD, 10);
  return prisma.user.upsert({
    where: { email: params.email },
    update: {
      name: params.name,
      role: params.role,
      bio: params.bio,
      avatar: params.avatar || null,
      passwordHash
    },
    create: {
      name: params.name,
      email: params.email,
      role: params.role,
      bio: params.bio,
      avatar: params.avatar || null,
      passwordHash
    }
  });
}

async function upsertArticle(
  story: SeedStory,
  sectionMap: Map<string, string>,
  userMap: Map<string, string>
) {
  const existingSeo = await prisma.articleSEO.findUnique({
    where: { slug: story.slug },
    include: { article: true }
  });

  const contentBlocks = story.contentBlocks?.length
    ? story.contentBlocks
    : legacyContentToBlocks(story.content);

  const payload = {
    title: story.title,
    content: story.content,
    contentBlocks: serializeBodyBlocks(contentBlocks),
    dek: story.dek,
    excerpt: story.excerpt,
    heroImage: story.image || null,
    heroAlt: story.heroAlt || story.title,
    status: story.status || "APPROVED",
    publishedAt: story.publishedAt === undefined ? new Date() : story.publishedAt,
    viewCount: story.viewCount || 0,
    authorId: userMap.get(story.authorEmail) || null,
    sectionId: sectionMap.get(story.section.toLowerCase()) || null
  } as const;

  if (existingSeo?.articleId) {
    return prisma.article.update({
      where: { id: existingSeo.articleId },
      data: {
        ...payload,
        seo: {
          update: {
            slug: story.slug,
            metaTitle: `${story.title} | London News`,
            metaDesc: story.dek,
            socialImage: story.image || null
          }
        }
      },
      include: { seo: true }
    });
  }

  return prisma.article.create({
    data: {
      ...payload,
      seo: {
        create: {
          slug: story.slug,
          metaTitle: `${story.title} | London News`,
          metaDesc: story.dek,
          socialImage: story.image || null
        }
      }
    },
    include: { seo: true }
  });
}

async function upsertClassified(
  listing: SeedClassified,
  userMap: Map<string, string>
) {
  return prisma.classifiedListing.upsert({
    where: { slug: listing.slug },
    update: {
      title: listing.title,
      category: listing.category,
      price: listing.price,
      location: listing.location,
      summary: listing.summary,
      description: listing.description,
      image: listing.image || null,
      sellerName: listing.sellerName,
      sellerEmail: listing.sellerEmail,
      sellerPhone: listing.sellerPhone || null,
      featured: Boolean(listing.featured),
      status: listing.status,
      submittedAt: listing.submittedAt || null,
      publishedAt: listing.publishedAt || null,
      expiresAt: listing.expiresAt || null,
      reviewNotes: listing.reviewNotes || null,
      submittedById: listing.submittedByEmail ? userMap.get(listing.submittedByEmail) || null : null
    },
    create: {
      slug: listing.slug,
      title: listing.title,
      category: listing.category,
      price: listing.price,
      location: listing.location,
      summary: listing.summary,
      description: listing.description,
      image: listing.image || null,
      sellerName: listing.sellerName,
      sellerEmail: listing.sellerEmail,
      sellerPhone: listing.sellerPhone || null,
      featured: Boolean(listing.featured),
      status: listing.status,
      submittedAt: listing.submittedAt || null,
      publishedAt: listing.publishedAt || null,
      expiresAt: listing.expiresAt || null,
      reviewNotes: listing.reviewNotes || null,
      submittedById: listing.submittedByEmail ? userMap.get(listing.submittedByEmail) || null : null
    }
  });
}

async function syncSections(sectionNames: Set<string>) {
  const sectionMap = new Map<string, string>();
  const sectionBySlug = new Map<string, { id: string; name: string }>();
  const legacyTechnology = await prisma.section.findUnique({
    where: { slug: "technology" },
    select: { id: true }
  });

  for (const category of recommendedCategories) {
    const section = await prisma.section.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        navLabel: category.navLabel || null,
        description: category.description,
        color: category.color || null,
        icon: category.icon || null,
        isVisible: category.isVisible !== false,
        showInTopNav: Boolean(category.showInTopNav),
        position: category.position,
        premium: Boolean(category.premium),
        seoTitle: category.seoTitle || null,
        seoDescription: category.seoDescription || null,
        parentId: null
      },
      create: {
        name: category.name,
        slug: category.slug,
        navLabel: category.navLabel || null,
        description: category.description,
        color: category.color || null,
        icon: category.icon || null,
        isVisible: category.isVisible !== false,
        showInTopNav: Boolean(category.showInTopNav),
        position: category.position,
        premium: Boolean(category.premium),
        seoTitle: category.seoTitle || null,
        seoDescription: category.seoDescription || null,
        parentId: null
      }
    });

    sectionMap.set(category.name.toLowerCase(), section.id);
    sectionBySlug.set(category.slug, { id: section.id, name: section.name });
  }

  for (const name of sectionNames) {
    const slug = slugify(name);
    if (sectionBySlug.has(slug)) continue;

    const section = await prisma.section.upsert({
      where: { slug },
      update: { name },
      create: { name, slug }
    });

    sectionMap.set(name.toLowerCase(), section.id);
    sectionBySlug.set(slug, { id: section.id, name: section.name });
  }

  for (const category of recommendedCategories) {
    if (!category.parentSlug) continue;

    const child = sectionBySlug.get(category.slug);
    const parent = sectionBySlug.get(category.parentSlug);
    if (!child) continue;

    await prisma.section.update({
      where: { id: child.id },
      data: { parentId: parent?.id || null }
    });
  }

  const techSection = sectionBySlug.get("tech");
  if (legacyTechnology?.id && techSection) {
    await prisma.article.updateMany({
      where: { sectionId: legacyTechnology.id },
      data: { sectionId: techSection.id }
    });

    await prisma.section.delete({
      where: { id: legacyTechnology.id }
    }).catch(() => null);
  }

  return sectionMap;
}

async function main() {
  await prisma.user.deleteMany({
    where: {
      email: {
        in: LEGACY_DEMO_EMAILS
      }
    }
  });

  const users = await Promise.all(DEMO_USERS.map((user) => upsertUser(user)));

  const userMap = new Map(users.map((user) => [user.email, user.id]));

  const sectionNames = new Set<string>(recommendedCategories.map((category) => category.name));

  for (const item of [
    articlePageData.section,
    categoryPageData.name,
    ...homepageData.goodNewsStories.map((story) => story.section),
    ...homepageData.supportingStories.map((story) => story.section),
    homepageData.secondFeature.section,
    ...homepageData.tertiaryStories.map((story) => story.section),
    ...categoryPageData.featuredStories.map((story) => story.section),
    ...categoryPageData.latestStories.map((story) => story.section),
    ...articlePageData.relatedStories.map((story) => story.section)
  ]) {
    sectionNames.add(item);
  }

  const sectionMap = await syncSections(sectionNames);

  const storyPool: SeedStory[] = [
    ...homepageData.goodNewsStories.map((story) => {
      const slug = hrefToSlug(story.href) as keyof typeof goodNewsStoryDetails;
      const detail = goodNewsStoryDetails[slug];
      const blocks = buildGoodNewsBlocks(slug);

      return {
        slug,
        title: story.title,
        section: story.section,
        excerpt: story.excerpt,
        dek: detail.dek,
        image: story.image,
        heroAlt: detail.heroAlt,
        authorEmail: detail.authorEmail,
        content: bodyBlocksToText(blocks),
        contentBlocks: blocks,
        status: "APPROVED" as const,
        publishedAt: detail.publishedAt,
        viewCount: detail.viewCount
      };
    }),
    {
      slug: articlePageData.slug,
      title: articlePageData.title,
      section: articlePageData.section,
      excerpt: articlePageData.relatedStories[0].excerpt,
      dek: articlePageData.dek,
      image: articlePageData.heroImage,
      heroAlt: articlePageData.heroAlt,
      authorEmail: "journalist1@londonnews.local",
      content: bodyToContent(),
      contentBlocks: articlePageData.body,
      status: "APPROVED",
      publishedAt: new Date("2026-04-16T10:15:00.000Z"),
      viewCount: 942
    },
    ...homepageData.supportingStories.map((story, index) => ({
      slug: hrefToSlug(story.href),
      title: story.title,
      section: story.section,
      excerpt: story.excerpt,
      dek: story.excerpt,
      image: story.image,
      authorEmail: index % 2 === 0 ? "editor1@londonnews.local" : "journalist1@londonnews.local",
      content: buildGenericContent(story),
      contentBlocks: buildGenericBlocks(story),
      status: "APPROVED" as const,
      publishedAt: new Date(Date.now() - (index + 1) * 86_400_000),
      viewCount: 500 - index * 45
    })),
    {
      slug: hrefToSlug(homepageData.secondFeature.href),
      title: homepageData.secondFeature.title,
      section: homepageData.secondFeature.section,
      excerpt: homepageData.secondFeature.excerpt,
      dek: homepageData.secondFeature.excerpt,
      image: homepageData.secondFeature.image,
      authorEmail: "editor2@londonnews.local",
      content: buildGenericContent(homepageData.secondFeature),
      contentBlocks: buildGenericBlocks(homepageData.secondFeature),
      status: "APPROVED",
      publishedAt: new Date(Date.now() - 2 * 86_400_000),
      viewCount: 710
    },
    ...homepageData.tertiaryStories.map((story, index) => ({
      slug: hrefToSlug(story.href),
      title: story.title,
      section: story.section,
      excerpt: story.excerpt,
      dek: story.excerpt,
      image: story.image,
      authorEmail: "journalist2@londonnews.local",
      content: buildGenericContent(story),
      contentBlocks: buildGenericBlocks(story),
      status: "APPROVED" as const,
      publishedAt: new Date(Date.now() - (index + 3) * 86_400_000),
      viewCount: 340 - index * 40
    })),
    ...articlePageData.relatedStories.map((story, index) => ({
      slug: hrefToSlug(story.href),
      title: story.title,
      section: story.section,
      excerpt: story.excerpt,
      dek: story.excerpt,
      image: story.image,
      authorEmail: "journalist1@londonnews.local",
      content: buildGenericContent(story),
      contentBlocks: buildGenericBlocks(story),
      status: "APPROVED" as const,
      publishedAt: new Date(Date.now() - (index + 5) * 86_400_000),
      viewCount: 270 - index * 25
    })),
    ...categoryPageData.featuredStories.map((story, index) => ({
      slug: hrefToSlug(story.href),
      title: story.title,
      section: story.section,
      excerpt: story.excerpt,
      dek: story.excerpt,
      image: story.image,
      authorEmail: "editor2@londonnews.local",
      content: buildGenericContent(story),
      contentBlocks: buildGenericBlocks(story),
      status: "APPROVED" as const,
      publishedAt: new Date(Date.now() - (index + 7) * 86_400_000),
      viewCount: 260 - index * 18
    })),
    ...categoryPageData.latestStories.map((story, index) => ({
      slug: hrefToSlug(story.href),
      title: story.title,
      section: story.section,
      excerpt: story.excerpt,
      dek: story.excerpt,
      image: story.image,
      authorEmail: "guestwriter1@londonnews.local",
      content: buildGenericContent(story),
      contentBlocks: buildGenericBlocks(story),
      status: "APPROVED" as const,
      publishedAt: new Date(Date.now() - (index + 9) * 86_400_000),
      viewCount: 180 - index * 12
    })),
    {
      slug: "city-hall-borough-housing-levy-plan",
      title: "City Hall weighs a borough-by-borough housing levy overhaul",
      section: "City Hall",
      excerpt: "Deputy mayor briefings suggest a more targeted approach to unlocking stalled housing sites.",
      dek: "New City Hall proposals could reshape how boroughs fund infrastructure and affordable homes.",
      authorEmail: "journalist2@londonnews.local",
      content: buildGenericContent({
        title: "City Hall weighs a borough-by-borough housing levy overhaul",
        excerpt: "Deputy mayor briefings suggest a more targeted approach to unlocking stalled housing sites.",
        section: "City Hall"
      }),
      contentBlocks: buildGenericBlocks({
        title: "City Hall weighs a borough-by-borough housing levy overhaul",
        excerpt: "Deputy mayor briefings suggest a more targeted approach to unlocking stalled housing sites.",
        section: "City Hall"
      }),
      status: "APPROVED",
      publishedAt: new Date("2026-04-15T08:00:00.000Z"),
      viewCount: 364
    },
    {
      slug: "westminster-commuter-tax-relief-briefing",
      title: "Westminster readies new commuter tax relief briefing for London MPs",
      section: "Westminster",
      excerpt: "Treasury allies are testing a package aimed at daily rail costs and zone-based commuter pressure.",
      dek: "The Westminster desk is seeded with a live policy story tied directly to London readers.",
      authorEmail: "editor1@londonnews.local",
      content: buildGenericContent({
        title: "Westminster readies new commuter tax relief briefing for London MPs",
        excerpt: "Treasury allies are testing a package aimed at daily rail costs and zone-based commuter pressure.",
        section: "Westminster"
      }),
      contentBlocks: buildGenericBlocks({
        title: "Westminster readies new commuter tax relief briefing for London MPs",
        excerpt: "Treasury allies are testing a package aimed at daily rail costs and zone-based commuter pressure.",
        section: "Westminster"
      }),
      status: "APPROVED",
      publishedAt: new Date("2026-04-14T12:30:00.000Z"),
      viewCount: 341
    },
    {
      slug: "london-marginals-election-ground-campaign",
      title: "Campaign teams pour resources into London marginals ahead of election sprint",
      section: "Elections",
      excerpt: "Party organisers say outer-London seats are again shaping where national messages land first.",
      dek: "The elections topic page opens with a campaign-ground story focused on London battlegrounds.",
      authorEmail: "journalist1@londonnews.local",
      content: buildGenericContent({
        title: "Campaign teams pour resources into London marginals ahead of election sprint",
        excerpt: "Party organisers say outer-London seats are again shaping where national messages land first.",
        section: "Elections"
      }),
      contentBlocks: buildGenericBlocks({
        title: "Campaign teams pour resources into London marginals ahead of election sprint",
        excerpt: "Party organisers say outer-London seats are again shaping where national messages land first.",
        section: "Elections"
      }),
      status: "APPROVED",
      publishedAt: new Date("2026-04-13T16:45:00.000Z"),
      viewCount: 318
    },
    {
      slug: "city-analyst-hiring-market-reopens",
      title: "City recruiters say analyst hiring is reopening faster than expected",
      section: "Work & Careers",
      excerpt: "Employers are rebuilding junior pipelines as deal flow and compliance work both return.",
      dek: "A seeded Work & Careers story helps the business taxonomy feel like a fuller legacy paper.",
      authorEmail: "editor2@londonnews.local",
      content: buildGenericContent({
        title: "City recruiters say analyst hiring is reopening faster than expected",
        excerpt: "Employers are rebuilding junior pipelines as deal flow and compliance work both return.",
        section: "Work & Careers"
      }),
      contentBlocks: buildGenericBlocks({
        title: "City recruiters say analyst hiring is reopening faster than expected",
        excerpt: "Employers are rebuilding junior pipelines as deal flow and compliance work both return.",
        section: "Work & Careers"
      }),
      status: "APPROVED",
      publishedAt: new Date("2026-04-12T09:10:00.000Z"),
      viewCount: 296
    },
    {
      slug: "shoreditch-ai-startups-sign-office-space",
      title: "Shoreditch AI companies sign more office space after a cautious winter",
      section: "Tech",
      excerpt: "Landlords and founders both report renewed confidence in hybrid-first teams keeping a London base.",
      dek: "The new Tech topic page launches with an office-and-startups story tied to the London economy.",
      authorEmail: "journalist2@londonnews.local",
      content: buildGenericContent({
        title: "Shoreditch AI companies sign more office space after a cautious winter",
        excerpt: "Landlords and founders both report renewed confidence in hybrid-first teams keeping a London base.",
        section: "Tech"
      }),
      contentBlocks: buildGenericBlocks({
        title: "Shoreditch AI companies sign more office space after a cautious winter",
        excerpt: "Landlords and founders both report renewed confidence in hybrid-first teams keeping a London base.",
        section: "Tech"
      }),
      status: "APPROVED",
      publishedAt: new Date("2026-04-11T11:20:00.000Z"),
      viewCount: 284
    },
    {
      slug: "national-theatre-new-writing-surge",
      title: "National Theatre bets on a new-writing surge after stronger spring demand",
      section: "Theatre",
      excerpt: "Producers say younger audiences are returning for short-run premieres and contemporary work.",
      dek: "The theatre topic page now opens with a seeded arts story built for a proper culture desk.",
      authorEmail: "guestwriter2@londonnews.local",
      content: buildGenericContent({
        title: "National Theatre bets on a new-writing surge after stronger spring demand",
        excerpt: "Producers say younger audiences are returning for short-run premieres and contemporary work.",
        section: "Theatre"
      }),
      contentBlocks: buildGenericBlocks({
        title: "National Theatre bets on a new-writing surge after stronger spring demand",
        excerpt: "Producers say younger audiences are returning for short-run premieres and contemporary work.",
        section: "Theatre"
      }),
      status: "APPROVED",
      publishedAt: new Date("2026-04-10T18:30:00.000Z"),
      viewCount: 233
    },
    {
      slug: "small-venues-midnight-economy-music",
      title: "London's small venues say the midnight economy still decides the music scene",
      section: "Music",
      excerpt: "Promoters argue that licensing and late transport remain as important as streaming economics.",
      dek: "The music topic page launches with a London venues story rooted in the city's live scene.",
      authorEmail: "guestwriter1@londonnews.local",
      content: buildGenericContent({
        title: "London's small venues say the midnight economy still decides the music scene",
        excerpt: "Promoters argue that licensing and late transport remain as important as streaming economics.",
        section: "Music"
      }),
      contentBlocks: buildGenericBlocks({
        title: "London's small venues say the midnight economy still decides the music scene",
        excerpt: "Promoters argue that licensing and late transport remain as important as streaming economics.",
        section: "Music"
      }),
      status: "APPROVED",
      publishedAt: new Date("2026-04-09T19:15:00.000Z"),
      viewCount: 221
    },
    {
      slug: "indie-cinemas-awards-season-programming",
      title: "Independent cinemas rethink awards-season programming to pull younger audiences",
      section: "Film",
      excerpt: "Operators are mixing repertory nights, director talks, and cheaper memberships to rebuild habits.",
      dek: "Film becomes a dedicated London News topic page with its own seeded cinema story.",
      authorEmail: "editor1@londonnews.local",
      content: buildGenericContent({
        title: "Independent cinemas rethink awards-season programming to pull younger audiences",
        excerpt: "Operators are mixing repertory nights, director talks, and cheaper memberships to rebuild habits.",
        section: "Film"
      }),
      contentBlocks: buildGenericBlocks({
        title: "Independent cinemas rethink awards-season programming to pull younger audiences",
        excerpt: "Operators are mixing repertory nights, director talks, and cheaper memberships to rebuild habits.",
        section: "Film"
      }),
      status: "APPROVED",
      publishedAt: new Date("2026-04-08T14:00:00.000Z"),
      viewCount: 214
    },
    {
      slug: "design-studios-reuse-materials-fitouts",
      title: "Design studios turn to salvage yards as reuse becomes a London fit-out marker",
      section: "Design",
      excerpt: "Architects and workplace designers say clients now expect visible sustainability in interior choices.",
      dek: "The design topic page now has its own seeded story bridging culture, business, and city aesthetics.",
      authorEmail: "journalist1@londonnews.local",
      content: buildGenericContent({
        title: "Design studios turn to salvage yards as reuse becomes a London fit-out marker",
        excerpt: "Architects and workplace designers say clients now expect visible sustainability in interior choices.",
        section: "Design"
      }),
      contentBlocks: buildGenericBlocks({
        title: "Design studios turn to salvage yards as reuse becomes a London fit-out marker",
        excerpt: "Architects and workplace designers say clients now expect visible sustainability in interior choices.",
        section: "Design"
      }),
      status: "APPROVED",
      publishedAt: new Date("2026-04-07T07:40:00.000Z"),
      viewCount: 205
    },
    {
      slug: "borough-housing-strategy-draft",
      title: "Borough housing strategy enters draft stage ahead of consultation",
      section: "Policy",
      excerpt: "Draft article seeded for guest-writer workflow.",
      dek: "A seeded draft demonstrating the guest-writer side of the article editor.",
      authorEmail: "guestwriter1@londonnews.local",
      content: buildGenericContent({
        title: "Borough housing strategy enters draft stage ahead of consultation",
        excerpt: "Draft article seeded for guest-writer workflow.",
        section: "Policy"
      }),
      contentBlocks: buildGenericBlocks({
        title: "Borough housing strategy enters draft stage ahead of consultation",
        excerpt: "Draft article seeded for guest-writer workflow.",
        section: "Policy"
      }),
      status: "DRAFT",
      publishedAt: null,
      viewCount: 0
    },
    {
      slug: "city-hall-budget-notes-review",
      title: "City Hall budget notes are waiting for editor review",
      section: "City Hall",
      excerpt: "Seeded review-queue entry for the editorial dashboard.",
      dek: "A story currently in review so the workflow is visible on first run.",
      authorEmail: "guestwriter2@londonnews.local",
      content: buildGenericContent({
        title: "City Hall budget notes are waiting for editor review",
        excerpt: "Seeded review-queue entry for the editorial dashboard.",
        section: "City Hall"
      }),
      contentBlocks: buildGenericBlocks({
        title: "City Hall budget notes are waiting for editor review",
        excerpt: "Seeded review-queue entry for the editorial dashboard.",
        section: "City Hall"
      }),
      status: "IN_REVIEW",
      publishedAt: null,
      viewCount: 0
    }
  ];

  const articleMap = new Map<string, string>();
  for (const story of storyPool) {
    const article = await upsertArticle(story, sectionMap, userMap);
    articleMap.set(story.slug, article.id);
  }

  const classifiedsPool: SeedClassified[] = [
    ...classifiedListings.map((listing, index) => ({
      slug: listing.slug,
      category: listing.category,
      title: listing.title,
      price: listing.price,
      location: listing.location,
      summary: listing.summary,
      description: listing.description.join("\n\n"),
      image: listing.image,
      sellerName: listing.sellerName,
      sellerEmail: listing.contactEmail,
      sellerPhone: listing.sellerPhone,
      featured: listing.featured,
      status: "APPROVED" as const,
      // publishedAt/expiresAt are anchored to seed run time (not the fixture's fixed
      // postedAt) so listings stay live regardless of how long ago this seed file
      // was written or how far in the future it's actually run.
      submittedAt: new Date(Date.now() - 3_600_000),
      publishedAt: new Date(),
      expiresAt: new Date(Date.now() + 45 * 86_400_000),
      submittedByEmail: index % 2 === 0 ? "editor1@londonnews.local" : "editor2@londonnews.local"
    })),
    {
      slug: "notting-hill-barista-weekend-role",
      category: "Jobs",
      title: "Weekend barista role available in Notting Hill",
      price: "GBP 15 per hour",
      location: "Notting Hill",
      summary: "Seeded review-queue listing so the classifieds moderation desk is populated on first run.",
      description: [
        "Independent cafe seeking a confident weekend barista with prior espresso-machine experience.",
        "Early starts, friendly neighbourhood team, and immediate trial shifts available."
      ].join("\n\n"),
      sellerName: "Hollis Coffee",
      sellerEmail: "classifieds+barista@londonnews.local",
      sellerPhone: "+44 20 7946 0860",
      status: "IN_REVIEW",
      submittedAt: new Date("2026-04-21T06:45:00.000Z"),
      publishedAt: null,
      expiresAt: new Date("2026-05-21T00:00:00.000Z"),
      reviewNotes: "Check pay-rate formatting and confirm whether weekend-only should be reflected in the headline.",
      submittedByEmail: "guestwriter1@londonnews.local"
    },
    {
      slug: "walthamstow-piano-lessons-community",
      category: "Services",
      title: "Community piano lessons in Walthamstow",
      price: "From GBP 25 per session",
      location: "Walthamstow",
      summary: "Draft listing showing the editorial side of the classifieds creation flow.",
      description: [
        "Private and small-group piano lessons for beginners, returners, and children preparing for music exams.",
        "Flexible weekday evening slots available, with introductory consultation by arrangement."
      ].join("\n\n"),
      sellerName: "Marta Evans",
      sellerEmail: "classifieds+piano@londonnews.local",
      sellerPhone: "+44 20 7946 0861",
      status: "DRAFT",
      submittedAt: null,
      publishedAt: null,
      expiresAt: new Date("2026-06-15T00:00:00.000Z"),
      reviewNotes: "",
      submittedByEmail: "editor1@londonnews.local"
    },
    {
      slug: "southbank-event-photography-last-minute",
      category: "Services",
      title: "Last-minute South Bank event photographer",
      price: "From GBP 300",
      location: "South Bank",
      summary: "Rejected example kept in the seed so status filtering is visible in the admin desk.",
      description: [
        "Same-week availability for conferences, launches, and private events across central London.",
        "Rejected in seed because the first submission lacked enough seller verification detail."
      ].join("\n\n"),
      sellerName: "Luca Steele",
      sellerEmail: "classifieds+southbankphoto@londonnews.local",
      sellerPhone: "+44 20 7946 0862",
      status: "REJECTED",
      submittedAt: new Date("2026-04-18T09:00:00.000Z"),
      publishedAt: null,
      expiresAt: new Date("2026-05-18T00:00:00.000Z"),
      reviewNotes: "Rejected in seed demo due to incomplete verification and vague pricing detail.",
      submittedByEmail: "guestwriter2@londonnews.local"
    }
  ];

  for (const listing of classifiedsPool) {
    await upsertClassified(listing, userMap);
  }

  const homepage = await prisma.homepage.upsert({
    where: { slug: "default" },
    update: {
      title: "Default Homepage",
      isActive: true,
      seoTitle: "London News",
      seoDescription: "The London News front page.",
      seoImage: homepageData.goodNewsStories[0]?.image || articlePageData.heroImage,
      settings: stringifyJsonField(defaultHomepageSettings())
    },
    create: {
      slug: "default",
      title: "Default Homepage",
      isActive: true,
      seoTitle: "London News",
      seoDescription: "The London News front page.",
      seoImage: homepageData.goodNewsStories[0]?.image || articlePageData.heroImage,
      settings: stringifyJsonField(defaultHomepageSettings())
    }
  });

  await prisma.homepage.updateMany({
    where: { id: { not: homepage.id } },
    data: { isActive: false }
  });

  await prisma.homepageSection.deleteMany({
    where: { homepageId: homepage.id }
  });

  const homepageSections: Array<{
    key: string;
    kind: string;
    title: string;
    slugs: string[];
  }> = [
    {
      key: "leadStory",
      kind: "LEAD_STORY",
      title: homepageData.goodNewsTitle,
      slugs: homepageData.goodNewsStories.map((story) => hrefToSlug(story.href))
    },
    {
      key: "supportingStories",
      kind: "SUPPORTING_STORIES",
      title: "Supporting stories",
      slugs: homepageData.supportingStories.map((story) => hrefToSlug(story.href))
    },
    {
      key: "secondFeature",
      kind: "FEATURE",
      title: "Second feature",
      slugs: [hrefToSlug(homepageData.secondFeature.href)]
    },
    {
      key: "tertiaryStories",
      kind: "TERTIARY_STORIES",
      title: "Tertiary stories",
      slugs: homepageData.tertiaryStories.map((story) => hrefToSlug(story.href))
    },
    {
      key: "topHeadlines",
      kind: "HEADLINE_STACK",
      title: "Top headlines",
      slugs: articlePageData.relatedStories.map((story) => hrefToSlug(story.href))
    }
  ];

  for (const [index, section] of homepageSections.entries()) {
    await prisma.homepageSection.create({
      data: {
        homepageId: homepage.id,
        key: section.key,
        kind: section.kind,
        title: section.title,
        position: index + 1,
        settings: stringifyJsonField({}),
        slots: {
          create: section.slugs
            .map((slug, slotIndex) => articleMap.get(slug))
            .filter((id): id is string => Boolean(id))
            .map((articleId, slotIndex) => ({
              position: slotIndex + 1,
              articleId,
              settings: stringifyJsonField({})
            }))
        }
      }
    });
  }

  const homepageSettings = defaultHomepageSettings();
  const surveyDay = getMoodSurveyDay();
  const seededMoodVotesByKey: Record<string, number> = {
    happy: 41,
    sad: 3,
    "cant-complain": 6
  };

  await prisma.moodSurveyVote.deleteMany({
    where: {
      homepageId: homepage.id,
      surveyDay
    }
  });

  await prisma.moodSurveyVote.createMany({
    data: homepageSettings.moodOptions.flatMap((option) =>
      Array.from({ length: seededMoodVotesByKey[option.key] || 0 }, (_, index) => ({
        homepageId: homepage.id,
        visitorId: `seed-${option.key}-${index + 1}`,
        surveyDay,
        optionKey: option.key,
        optionLabel: option.label,
        createdAt: new Date(Date.now() - (index + 1) * 60_000)
      }))
    )
  });

  const existingDraft = await prisma.homepageVersion.findFirst({
    where: {
      homepageId: homepage.id,
      label: "Morning homepage draft"
    }
  });

  const homepageDraftData = {
    homepageId: homepage.id,
    label: "Morning homepage draft",
    status: "DRAFT",
    previewToken: "demo-preview-token",
    createdById: userMap.get("editor1@londonnews.local"),
    snapshot: stringifyJsonField({
      title: "Default Homepage",
      slug: "default",
      seoTitle: "London News",
      seoDescription: "The London News front page.",
      seoImage: homepageData.goodNewsStories[0]?.image || articlePageData.heroImage,
      settings: defaultHomepageSettings(),
      sections: homepageSections.map((section, index) => ({
        key: section.key,
        kind: section.kind,
        title: section.title,
        position: index + 1,
        settings: {},
        slots: section.slugs
          .map((slug, slotIndex) => articleMap.get(slug))
          .filter((id): id is string => Boolean(id))
          .map((articleId, slotIndex) => ({
            position: slotIndex + 1,
            articleId
          }))
      }))
    })
  } as const;

  if (existingDraft) {
    await prisma.homepageVersion.update({
      where: { id: existingDraft.id },
      data: homepageDraftData
    });
  } else {
    await prisma.homepageVersion.create({
      data: homepageDraftData
    });
  }

  console.log("London News seed complete.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

// import { hash } from "bcryptjs";
// import { PrismaClient } from "@prisma/client";
// import { classifiedListings } from "../lib/classifieds-data";
// import { recommendedCategories } from "../lib/categories/recommended-categories";
// import { articlePageData, categoryPageData } from "../lib/editorial-data";
// import { legacyContentToBlocks, serializeBodyBlocks } from "../lib/articles/blocks";
// import type { BodyBlock } from "../lib/cms-types";
// import { homepageData } from "../lib/homepage-data";
// import { defaultHomepageSettings } from "../lib/cms/utils";
// import { getMoodSurveyDay } from "../lib/mood";
// import { stringifyJsonField } from "../utils/json";
// import { slugify } from "../utils/slug";

// const prisma = new PrismaClient();
// const DEMO_PASSWORD = "LondonNews123!";

// type SeedUserRole = "JMHV" | "SUPERADMIN" | "EDITOR" | "JOURNALIST" | "GUEST_WRITER";

// const DEMO_USERS: Array<{
//   email: string;
//   name: string;
//   role: SeedUserRole;
//   bio: string;
//   avatar?: string;
// }> = [
//   {
//     email: "superadmin@londonnews.local",
//     name: "Martha Cole",
//     role: "SUPERADMIN",
//     bio: "Runs the London News platform, team permissions, and newsroom operations."
//   },
//   {
//     email: "jmhv@londonnews.local",
//     name: "JMHV",
//     role: "JMHV",
//     bio: "Owner-level account for final approvals, user management, and executive newsroom review."
//   },
//   {
//     email: "editor1@londonnews.local",
//     name: "Daniel Ross",
//     role: "EDITOR",
//     bio: "Front-page editor overseeing homepage curation and publication workflow."
//   },
//   {
//     email: "editor2@londonnews.local",
//     name: "Priya Shah",
//     role: "EDITOR",
//     bio: "News editor coordinating desks, homepage timing, and line edits across the report."
//   },
//   {
//     email: "journalist1@londonnews.local",
//     name: "Amelia Hart",
//     role: "JOURNALIST",
//     bio: articlePageData.author.bio,
//     avatar: articlePageData.author.avatar
//   },
//   {
//     email: "journalist2@londonnews.local",
//     name: "Theo Bennett",
//     role: "JOURNALIST",
//     bio: "City reporter covering policy, transport, and accountability beats across London."
//   },
//   {
//     email: "guestwriter1@londonnews.local",
//     name: "Aisha Khan",
//     role: "GUEST_WRITER",
//     bio: "Guest writer account for drafting and submitting stories into review."
//   },
//   {
//     email: "guestwriter2@londonnews.local",
//     name: "Leila Moore",
//     role: "GUEST_WRITER",
//     bio: "Guest writer login for opinion, culture, and community desk submissions."
//   }
// ];

// const LEGACY_DEMO_EMAILS = [
//   "editor@londonnews.local",
//   "writer@londonnews.local",
//   "reporter@londonnews.local"
// ];

// type SeedStory = {
//   slug: string;
//   title: string;
//   section: string;
//   excerpt: string;
//   dek: string;
//   image?: string;
//   heroAlt?: string;
//   authorEmail: string;
//   content: string;
//   contentBlocks?: BodyBlock[];
//   status?: "DRAFT" | "IN_REVIEW" | "APPROVED" | "REJECTED";
//   publishedAt?: Date | null;
//   viewCount?: number;
// };

// type SeedClassified = {
//   slug: string;
//   category: string;
//   title: string;
//   price: string;
//   location: string;
//   summary: string;
//   description: string;
//   image?: string;
//   sellerName: string;
//   sellerEmail: string;
//   sellerPhone?: string;
//   featured?: boolean;
//   status: "DRAFT" | "IN_REVIEW" | "APPROVED" | "REJECTED";
//   submittedAt?: Date | null;
//   publishedAt?: Date | null;
//   expiresAt?: Date | null;
//   reviewNotes?: string | null;
//   submittedByEmail?: string | null;
// };

// function hrefToSlug(href: string) {
//   return href.split("/").filter(Boolean).pop() || slugify(href);
// }

// function bodyToContent() {
//   return articlePageData.body
//     .map((block) => {
//       if (block.type === "subhead") return `## ${block.content}`;
//       if (block.type === "quote") return `> ${block.content}`;
//       if (block.type === "list") return block.items.map((item) => `- ${item}`).join("\n");
//       if (block.type === "image") return block.caption || block.alt;
//       return block.content;
//     })
//     .join("\n\n");
// }

// function buildGenericBlocks(story: { title: string; excerpt: string; section: string }): BodyBlock[] {
//   return [
//     {
//       type: "paragraph",
//       content: `${story.excerpt} Editors can expand this seeded story with reporting updates, source material, and desk-specific framing as coverage develops.`
//     },
//     {
//       type: "subhead",
//       content: `${story.section} desk context`
//     },
//     {
//       type: "paragraph",
//       content: `The ${story.section} desk is seeded with structured article blocks so the newsroom can exercise authoring, preview, search, and revision history from the first local boot.`
//     },
//     {
//       type: "quote",
//       content: "Early seeded coverage should read like a usable local news report, not like implementation filler.",
//       attribution: "London News editorial template"
//     },
//     {
//       type: "list",
//       items: [
//         "Confirm the editorial angle and source notes",
//         "Add reporting updates or desk-specific context",
//         "Publish, schedule, or return the story for edits"
//       ]
//     }
//   ];
// }

// function buildGenericContent(story: { title: string; excerpt: string; section: string }) {
//   return bodyBlocksToText(buildGenericBlocks(story));
// }

// const goodNewsStoryDetails = {
//   "lewis-capaldi-bst-hyde-park-livestream": {
//     dek: "Lewis Capaldi's Hyde Park return is set to reach far beyond the ticket line, with a free global livestream turning a London headline gig into a shared summer event.",
//     heroAlt: "Concert crowd with phones raised during an outdoor performance",
//     authorEmail: "editor1@londonnews.local",
//     publishedAt: new Date("2026-07-11T18:30:00.000Z"),
//     viewCount: 1240,
//     sourceName: "The Scottish Sun",
//     sourceUrl: "https://www.thescottishsun.co.uk/tvandshowbiz/16509546/lewis-capaldi-london-gig-streamed-live-youtube-hyde-park/",
//     paragraphs: [
//       "Lewis Capaldi's BST Hyde Park date has become good news for more than just the crowd inside the gates, with organisers making the show available to watch live around the world on Saturday night.",
//       "For London, that turns one of the capital's biggest summer music fixtures into a much wider civic moment. A sold-out park show still feels local on the ground, but the livestream gives the city an event that can travel well beyond the venue itself.",
//       "It is the kind of upbeat, accessible culture story a summer homepage needs: a major artist, a recognisable London setting, and a free way for people to join in even if they are following along from home."
//     ]
//   },
//   "bayeux-tapestry-british-museum-london-loan": {
//     dek: "A rare Bayeux Tapestry loan would hand London one of the most significant museum draws in the city's cultural calendar.",
//     heroAlt: "Visitors walking through a museum gallery in London",
//     authorEmail: "journalist1@londonnews.local",
//     publishedAt: new Date("2026-07-10T09:00:00.000Z"),
//     viewCount: 980,
//     sourceName: "The Guardian",
//     sourceUrl: "https://www.theguardian.com/world/2026/jul/10/bayeux-tapestry-arrives-british-museum-exhibition",
//     paragraphs: [
//       "London is set for a major museum moment with the Bayeux Tapestry due to be shown at the British Museum in what is being treated as a rare and high-profile loan.",
//       "The significance goes beyond a single exhibition slot. When a work of that historical weight lands in the capital, it resets the cultural conversation for months and gives residents and visitors a compelling reason to spend time in the city.",
//       "For London News readers, it is straightforward good news: a world-class object, a familiar public institution, and another reminder that the capital remains one of the strongest places in Europe to encounter major art and history in person."
//     ]
//   },
//   "barbican-veggery-pavilion-london": {
//     dek: "The Barbican's new Veggery pavilion blends architecture, urban growing, and public curiosity into one of the capital's more optimistic design stories this month.",
//     heroAlt: "Glasshouse plants inside a bright modern pavilion",
//     authorEmail: "journalist2@londonnews.local",
//     publishedAt: new Date("2026-07-08T12:15:00.000Z"),
//     viewCount: 860,
//     sourceName: "Wallpaper",
//     sourceUrl: "https://www.wallpaper.com/architecture/architecture-events/the-veggery-greenhouse-pavilion-london-uk",
//     paragraphs: [
//       "The Barbican's new Veggery pavilion is the kind of cheerful London project that works on multiple levels at once: it is visually striking, practical, and easy to understand as a public-facing idea.",
//       "The installation pulls food growing and greenhouse thinking into a high-profile architecture setting, which makes it feel more generous than a standard design intervention. It gives the city something lively to look at while also showing how everyday urban spaces can be reimagined.",
//       "That combination of design value and public usefulness is what makes it strong homepage material. It is a London story about invention, access, and culture without any heavy explanation needed."
//     ]
//   },
//   "bonsai-treehouse-exhibition-london-summer": {
//     dek: "A bonsai treehouse exhibition running through August gives London a fresh family-friendly design stop for the summer.",
//     heroAlt: "Miniature tree display framed by warm summer light",
//     authorEmail: "editor2@londonnews.local",
//     publishedAt: new Date("2026-07-04T11:00:00.000Z"),
//     viewCount: 790,
//     sourceName: "Wallpaper",
//     sourceUrl: "https://www.wallpaper.com/architecture/architecture-events/bonsai-treehouse-exhibition-london-uk",
//     paragraphs: [
//       "A bonsai treehouse exhibition now running in London adds a small-scale, slightly magical stop to the city's summer calendar, with enough design interest to attract adults and enough curiosity to pull in families.",
//       "The appeal here is its sense of discovery. London does not need every good-news story to be huge or headline-grabbing; sometimes a seasonal exhibition with a strong visual hook is exactly what makes the city feel more generous and worth exploring.",
//       "Because it runs through the end of August, it also has staying power. Readers can actually act on the story, plan a visit, and treat it as one of those distinctive little London outings that define a summer in the city."
//     ]
//   },
//   "summer-splash-royal-victoria-dock-return": {
//     dek: "Summer Splash is returning to Royal Victoria Dock with another free run, giving Londoners a simple and unusually scenic way to get outside later this month.",
//     heroAlt: "London skyline and water under summer light",
//     authorEmail: "editor1@londonnews.local",
//     publishedAt: new Date("2026-07-03T08:45:00.000Z"),
//     viewCount: 745,
//     sourceName: "The Sun",
//     sourceUrl: "https://www.thesun.co.uk/travel/39390954/gorgeous-english-lido-sweeping-city-views-returns-free/",
//     paragraphs: [
//       "Summer Splash is coming back to Royal Victoria Dock from late July, bringing back one of London's more unusual warm-weather rituals: an outdoor swim with skyline views and no ticket price attached.",
//       "That matters because genuinely free summer activities in the capital can still feel hard to come by, especially ones that look this distinctive. The dock setting gives the event a recognisable London identity rather than the feel of a generic seasonal pop-up.",
//       "It is exactly the kind of practical good news that belongs high on the homepage. People can put a date in the diary, make a cheap day of it, and feel that the city is offering something open, public, and fun."
//     ]
//   },
//   "queen-elizabeth-ii-garden-regents-park-opens": {
//     dek: "The new Queen Elizabeth II Garden adds another accessible green corner to central London and gives Regent's Park a fresh public destination.",
//     heroAlt: "Green public garden with flowers and walking paths",
//     authorEmail: "journalist1@londonnews.local",
//     publishedAt: new Date("2026-04-27T10:00:00.000Z"),
//     viewCount: 702,
//     sourceName: "The Guardian",
//     sourceUrl: "https://www.theguardian.com/environment/2026/apr/18/a-prickle-of-hedgehogs-and-an-armada-of-newts-wildlife-settles-in-at-londons-new-queen-elizabeth-garden",
//     paragraphs: [
//       "The opening of the Queen Elizabeth II Garden in Regent's Park is quieter than a concert or blockbuster exhibition, but it is still some of the best kind of London news: more public green space, more habitat, and another corner of the city that people can simply go and enjoy.",
//       "Openings like this matter because they improve the city in a durable way. A new public garden becomes part of everyday London life, whether that means lunchtime walks, family visits, or a calmer route through the park.",
//       "It also rounds out this good-news package with something lasting. Not every positive story has to be time-limited; some are about London becoming a slightly better place to spend time in."
//     ]
//   }
// } as const;

// function buildGoodNewsBlocks(slug: keyof typeof goodNewsStoryDetails): BodyBlock[] {
//   const story = goodNewsStoryDetails[slug];

//   return [
//     ...story.paragraphs.map((content) => ({
//       type: "paragraph" as const,
//       content
//     })),
//     {
//       type: "embed" as const,
//       href: story.sourceUrl,
//       label: `Source: ${story.sourceName}`
//     }
//   ];
// }

// function bodyBlocksToText(blocks: BodyBlock[]) {
//   return blocks
//     .map((block) => {
//       if (block.type === "paragraph") return block.content;
//       if (block.type === "subhead") return `## ${block.content}`;
//       if (block.type === "quote") {
//         return block.attribution ? `> ${block.content}\n— ${block.attribution}` : `> ${block.content}`;
//       }
//       if (block.type === "list") return block.items.map((item) => `- ${item}`).join("\n");
//       if (block.type === "image") return [block.caption, block.alt].filter(Boolean).join("\n");
//       if (block.type === "embed") return [block.label || "External reference", block.href].filter(Boolean).join("\n");
//       return [block.title, block.summary, block.href].filter(Boolean).join("\n");
//     })
//     .filter(Boolean)
//     .join("\n\n");
// }

// async function upsertUser(params: {
//   email: string;
//   name: string;
//   role: SeedUserRole;
//   bio: string;
//   avatar?: string;
// }) {
//   const passwordHash = await hash(DEMO_PASSWORD, 10);
//   return prisma.user.upsert({
//     where: { email: params.email },
//     update: {
//       name: params.name,
//       role: params.role,
//       bio: params.bio,
//       avatar: params.avatar || null,
//       passwordHash
//     },
//     create: {
//       name: params.name,
//       email: params.email,
//       role: params.role,
//       bio: params.bio,
//       avatar: params.avatar || null,
//       passwordHash
//     }
//   });
// }

// async function upsertArticle(
//   story: SeedStory,
//   sectionMap: Map<string, string>,
//   userMap: Map<string, string>
// ) {
//   const existingSeo = await prisma.articleSEO.findUnique({
//     where: { slug: story.slug },
//     include: { article: true }
//   });

//   const contentBlocks = story.contentBlocks?.length
//     ? story.contentBlocks
//     : legacyContentToBlocks(story.content);

//   const payload = {
//     title: story.title,
//     content: story.content,
//     contentBlocks: serializeBodyBlocks(contentBlocks),
//     dek: story.dek,
//     excerpt: story.excerpt,
//     heroImage: story.image || null,
//     heroAlt: story.heroAlt || story.title,
//     status: story.status || "APPROVED",
//     publishedAt: story.publishedAt === undefined ? new Date() : story.publishedAt,
//     viewCount: story.viewCount || 0,
//     authorId: userMap.get(story.authorEmail) || null,
//     sectionId: sectionMap.get(story.section.toLowerCase()) || null
//   } as const;

//   if (existingSeo?.articleId) {
//     return prisma.article.update({
//       where: { id: existingSeo.articleId },
//       data: {
//         ...payload,
//         seo: {
//           update: {
//             slug: story.slug,
//             metaTitle: `${story.title} | London News`,
//             metaDesc: story.dek,
//             socialImage: story.image || null
//           }
//         }
//       },
//       include: { seo: true }
//     });
//   }

//   return prisma.article.create({
//     data: {
//       ...payload,
//       seo: {
//         create: {
//           slug: story.slug,
//           metaTitle: `${story.title} | London News`,
//           metaDesc: story.dek,
//           socialImage: story.image || null
//         }
//       }
//     },
//     include: { seo: true }
//   });
// }

// async function upsertClassified(
//   listing: SeedClassified,
//   userMap: Map<string, string>
// ) {
//   return prisma.classifiedListing.upsert({
//     where: { slug: listing.slug },
//     update: {
//       title: listing.title,
//       category: listing.category,
//       price: listing.price,
//       location: listing.location,
//       summary: listing.summary,
//       description: listing.description,
//       image: listing.image || null,
//       sellerName: listing.sellerName,
//       sellerEmail: listing.sellerEmail,
//       sellerPhone: listing.sellerPhone || null,
//       featured: Boolean(listing.featured),
//       status: listing.status,
//       submittedAt: listing.submittedAt || null,
//       publishedAt: listing.publishedAt || null,
//       expiresAt: listing.expiresAt || null,
//       reviewNotes: listing.reviewNotes || null,
//       submittedById: listing.submittedByEmail ? userMap.get(listing.submittedByEmail) || null : null
//     },
//     create: {
//       slug: listing.slug,
//       title: listing.title,
//       category: listing.category,
//       price: listing.price,
//       location: listing.location,
//       summary: listing.summary,
//       description: listing.description,
//       image: listing.image || null,
//       sellerName: listing.sellerName,
//       sellerEmail: listing.sellerEmail,
//       sellerPhone: listing.sellerPhone || null,
//       featured: Boolean(listing.featured),
//       status: listing.status,
//       submittedAt: listing.submittedAt || null,
//       publishedAt: listing.publishedAt || null,
//       expiresAt: listing.expiresAt || null,
//       reviewNotes: listing.reviewNotes || null,
//       submittedById: listing.submittedByEmail ? userMap.get(listing.submittedByEmail) || null : null
//     }
//   });
// }

// async function syncSections(sectionNames: Set<string>) {
//   const sectionMap = new Map<string, string>();
//   const sectionBySlug = new Map<string, { id: string; name: string }>();
//   const legacyTechnology = await prisma.section.findUnique({
//     where: { slug: "technology" },
//     select: { id: true }
//   });

//   for (const category of recommendedCategories) {
//     const section = await prisma.section.upsert({
//       where: { slug: category.slug },
//       update: {
//         name: category.name,
//         navLabel: category.navLabel || null,
//         description: category.description,
//         color: category.color || null,
//         icon: category.icon || null,
//         isVisible: category.isVisible !== false,
//         showInTopNav: Boolean(category.showInTopNav),
//         position: category.position,
//         premium: Boolean(category.premium),
//         seoTitle: category.seoTitle || null,
//         seoDescription: category.seoDescription || null,
//         parentId: null
//       },
//       create: {
//         name: category.name,
//         slug: category.slug,
//         navLabel: category.navLabel || null,
//         description: category.description,
//         color: category.color || null,
//         icon: category.icon || null,
//         isVisible: category.isVisible !== false,
//         showInTopNav: Boolean(category.showInTopNav),
//         position: category.position,
//         premium: Boolean(category.premium),
//         seoTitle: category.seoTitle || null,
//         seoDescription: category.seoDescription || null,
//         parentId: null
//       }
//     });

//     sectionMap.set(category.name.toLowerCase(), section.id);
//     sectionBySlug.set(category.slug, { id: section.id, name: section.name });
//   }

//   for (const name of sectionNames) {
//     const slug = slugify(name);
//     if (sectionBySlug.has(slug)) continue;

//     const section = await prisma.section.upsert({
//       where: { slug },
//       update: { name },
//       create: { name, slug }
//     });

//     sectionMap.set(name.toLowerCase(), section.id);
//     sectionBySlug.set(slug, { id: section.id, name: section.name });
//   }

//   for (const category of recommendedCategories) {
//     if (!category.parentSlug) continue;

//     const child = sectionBySlug.get(category.slug);
//     const parent = sectionBySlug.get(category.parentSlug);
//     if (!child) continue;

//     await prisma.section.update({
//       where: { id: child.id },
//       data: { parentId: parent?.id || null }
//     });
//   }

//   const techSection = sectionBySlug.get("tech");
//   if (legacyTechnology?.id && techSection) {
//     await prisma.article.updateMany({
//       where: { sectionId: legacyTechnology.id },
//       data: { sectionId: techSection.id }
//     });

//     await prisma.section.delete({
//       where: { id: legacyTechnology.id }
//     }).catch(() => null);
//   }

//   return sectionMap;
// }

// async function main() {
//   await prisma.user.deleteMany({
//     where: {
//       email: {
//         in: LEGACY_DEMO_EMAILS
//       }
//     }
//   });

//   const users = await Promise.all(DEMO_USERS.map((user) => upsertUser(user)));

//   const userMap = new Map(users.map((user) => [user.email, user.id]));

//   const sectionNames = new Set<string>(recommendedCategories.map((category) => category.name));

//   for (const item of [
//     articlePageData.section,
//     categoryPageData.name,
//     ...homepageData.goodNewsStories.map((story) => story.section),
//     ...homepageData.supportingStories.map((story) => story.section),
//     homepageData.secondFeature.section,
//     ...homepageData.tertiaryStories.map((story) => story.section),
//     ...categoryPageData.featuredStories.map((story) => story.section),
//     ...categoryPageData.latestStories.map((story) => story.section),
//     ...articlePageData.relatedStories.map((story) => story.section)
//   ]) {
//     sectionNames.add(item);
//   }

//   const sectionMap = await syncSections(sectionNames);

//   const storyPool: SeedStory[] = [
//     ...homepageData.goodNewsStories.map((story) => {
//       const slug = hrefToSlug(story.href) as keyof typeof goodNewsStoryDetails;
//       const detail = goodNewsStoryDetails[slug];
//       const blocks = buildGoodNewsBlocks(slug);

//       return {
//         slug,
//         title: story.title,
//         section: story.section,
//         excerpt: story.excerpt,
//         dek: detail.dek,
//         image: story.image,
//         heroAlt: detail.heroAlt,
//         authorEmail: detail.authorEmail,
//         content: bodyBlocksToText(blocks),
//         contentBlocks: blocks,
//         status: "APPROVED" as const,
//         publishedAt: detail.publishedAt,
//         viewCount: detail.viewCount
//       };
//     }),
//     {
//       slug: articlePageData.slug,
//       title: articlePageData.title,
//       section: articlePageData.section,
//       excerpt: articlePageData.relatedStories[0].excerpt,
//       dek: articlePageData.dek,
//       image: articlePageData.heroImage,
//       heroAlt: articlePageData.heroAlt,
//       authorEmail: "journalist1@londonnews.local",
//       content: bodyToContent(),
//       contentBlocks: articlePageData.body,
//       status: "APPROVED",
//       publishedAt: new Date("2026-04-16T10:15:00.000Z"),
//       viewCount: 942
//     },
//     ...homepageData.supportingStories.map((story, index) => ({
//       slug: hrefToSlug(story.href),
//       title: story.title,
//       section: story.section,
//       excerpt: story.excerpt,
//       dek: story.excerpt,
//       image: story.image,
//       authorEmail: index % 2 === 0 ? "editor1@londonnews.local" : "journalist1@londonnews.local",
//       content: buildGenericContent(story),
//       contentBlocks: buildGenericBlocks(story),
//       status: "APPROVED" as const,
//       publishedAt: new Date(Date.now() - (index + 1) * 86_400_000),
//       viewCount: 500 - index * 45
//     })),
//     {
//       slug: hrefToSlug(homepageData.secondFeature.href),
//       title: homepageData.secondFeature.title,
//       section: homepageData.secondFeature.section,
//       excerpt: homepageData.secondFeature.excerpt,
//       dek: homepageData.secondFeature.excerpt,
//       image: homepageData.secondFeature.image,
//       authorEmail: "editor2@londonnews.local",
//       content: buildGenericContent(homepageData.secondFeature),
//       contentBlocks: buildGenericBlocks(homepageData.secondFeature),
//       status: "APPROVED",
//       publishedAt: new Date(Date.now() - 2 * 86_400_000),
//       viewCount: 710
//     },
//     ...homepageData.tertiaryStories.map((story, index) => ({
//       slug: hrefToSlug(story.href),
//       title: story.title,
//       section: story.section,
//       excerpt: story.excerpt,
//       dek: story.excerpt,
//       image: story.image,
//       authorEmail: "journalist2@londonnews.local",
//       content: buildGenericContent(story),
//       contentBlocks: buildGenericBlocks(story),
//       status: "APPROVED" as const,
//       publishedAt: new Date(Date.now() - (index + 3) * 86_400_000),
//       viewCount: 340 - index * 40
//     })),
//     ...articlePageData.relatedStories.map((story, index) => ({
//       slug: hrefToSlug(story.href),
//       title: story.title,
//       section: story.section,
//       excerpt: story.excerpt,
//       dek: story.excerpt,
//       image: story.image,
//       authorEmail: "journalist1@londonnews.local",
//       content: buildGenericContent(story),
//       contentBlocks: buildGenericBlocks(story),
//       status: "APPROVED" as const,
//       publishedAt: new Date(Date.now() - (index + 5) * 86_400_000),
//       viewCount: 270 - index * 25
//     })),
//     ...categoryPageData.featuredStories.map((story, index) => ({
//       slug: hrefToSlug(story.href),
//       title: story.title,
//       section: story.section,
//       excerpt: story.excerpt,
//       dek: story.excerpt,
//       image: story.image,
//       authorEmail: "editor2@londonnews.local",
//       content: buildGenericContent(story),
//       contentBlocks: buildGenericBlocks(story),
//       status: "APPROVED" as const,
//       publishedAt: new Date(Date.now() - (index + 7) * 86_400_000),
//       viewCount: 260 - index * 18
//     })),
//     ...categoryPageData.latestStories.map((story, index) => ({
//       slug: hrefToSlug(story.href),
//       title: story.title,
//       section: story.section,
//       excerpt: story.excerpt,
//       dek: story.excerpt,
//       image: story.image,
//       authorEmail: "guestwriter1@londonnews.local",
//       content: buildGenericContent(story),
//       contentBlocks: buildGenericBlocks(story),
//       status: "APPROVED" as const,
//       publishedAt: new Date(Date.now() - (index + 9) * 86_400_000),
//       viewCount: 180 - index * 12
//     })),
//     {
//       slug: "city-hall-borough-housing-levy-plan",
//       title: "City Hall weighs a borough-by-borough housing levy overhaul",
//       section: "City Hall",
//       excerpt: "Deputy mayor briefings suggest a more targeted approach to unlocking stalled housing sites.",
//       dek: "New City Hall proposals could reshape how boroughs fund infrastructure and affordable homes.",
//       authorEmail: "journalist2@londonnews.local",
//       content: buildGenericContent({
//         title: "City Hall weighs a borough-by-borough housing levy overhaul",
//         excerpt: "Deputy mayor briefings suggest a more targeted approach to unlocking stalled housing sites.",
//         section: "City Hall"
//       }),
//       contentBlocks: buildGenericBlocks({
//         title: "City Hall weighs a borough-by-borough housing levy overhaul",
//         excerpt: "Deputy mayor briefings suggest a more targeted approach to unlocking stalled housing sites.",
//         section: "City Hall"
//       }),
//       status: "APPROVED",
//       publishedAt: new Date("2026-04-15T08:00:00.000Z"),
//       viewCount: 364
//     },
//     {
//       slug: "westminster-commuter-tax-relief-briefing",
//       title: "Westminster readies new commuter tax relief briefing for London MPs",
//       section: "Westminster",
//       excerpt: "Treasury allies are testing a package aimed at daily rail costs and zone-based commuter pressure.",
//       dek: "The Westminster desk is seeded with a live policy story tied directly to London readers.",
//       authorEmail: "editor1@londonnews.local",
//       content: buildGenericContent({
//         title: "Westminster readies new commuter tax relief briefing for London MPs",
//         excerpt: "Treasury allies are testing a package aimed at daily rail costs and zone-based commuter pressure.",
//         section: "Westminster"
//       }),
//       contentBlocks: buildGenericBlocks({
//         title: "Westminster readies new commuter tax relief briefing for London MPs",
//         excerpt: "Treasury allies are testing a package aimed at daily rail costs and zone-based commuter pressure.",
//         section: "Westminster"
//       }),
//       status: "APPROVED",
//       publishedAt: new Date("2026-04-14T12:30:00.000Z"),
//       viewCount: 341
//     },
//     {
//       slug: "london-marginals-election-ground-campaign",
//       title: "Campaign teams pour resources into London marginals ahead of election sprint",
//       section: "Elections",
//       excerpt: "Party organisers say outer-London seats are again shaping where national messages land first.",
//       dek: "The elections topic page opens with a campaign-ground story focused on London battlegrounds.",
//       authorEmail: "journalist1@londonnews.local",
//       content: buildGenericContent({
//         title: "Campaign teams pour resources into London marginals ahead of election sprint",
//         excerpt: "Party organisers say outer-London seats are again shaping where national messages land first.",
//         section: "Elections"
//       }),
//       contentBlocks: buildGenericBlocks({
//         title: "Campaign teams pour resources into London marginals ahead of election sprint",
//         excerpt: "Party organisers say outer-London seats are again shaping where national messages land first.",
//         section: "Elections"
//       }),
//       status: "APPROVED",
//       publishedAt: new Date("2026-04-13T16:45:00.000Z"),
//       viewCount: 318
//     },
//     {
//       slug: "city-analyst-hiring-market-reopens",
//       title: "City recruiters say analyst hiring is reopening faster than expected",
//       section: "Work & Careers",
//       excerpt: "Employers are rebuilding junior pipelines as deal flow and compliance work both return.",
//       dek: "A seeded Work & Careers story helps the business taxonomy feel like a fuller legacy paper.",
//       authorEmail: "editor2@londonnews.local",
//       content: buildGenericContent({
//         title: "City recruiters say analyst hiring is reopening faster than expected",
//         excerpt: "Employers are rebuilding junior pipelines as deal flow and compliance work both return.",
//         section: "Work & Careers"
//       }),
//       contentBlocks: buildGenericBlocks({
//         title: "City recruiters say analyst hiring is reopening faster than expected",
//         excerpt: "Employers are rebuilding junior pipelines as deal flow and compliance work both return.",
//         section: "Work & Careers"
//       }),
//       status: "APPROVED",
//       publishedAt: new Date("2026-04-12T09:10:00.000Z"),
//       viewCount: 296
//     },
//     {
//       slug: "shoreditch-ai-startups-sign-office-space",
//       title: "Shoreditch AI companies sign more office space after a cautious winter",
//       section: "Tech",
//       excerpt: "Landlords and founders both report renewed confidence in hybrid-first teams keeping a London base.",
//       dek: "The new Tech topic page launches with an office-and-startups story tied to the London economy.",
//       authorEmail: "journalist2@londonnews.local",
//       content: buildGenericContent({
//         title: "Shoreditch AI companies sign more office space after a cautious winter",
//         excerpt: "Landlords and founders both report renewed confidence in hybrid-first teams keeping a London base.",
//         section: "Tech"
//       }),
//       contentBlocks: buildGenericBlocks({
//         title: "Shoreditch AI companies sign more office space after a cautious winter",
//         excerpt: "Landlords and founders both report renewed confidence in hybrid-first teams keeping a London base.",
//         section: "Tech"
//       }),
//       status: "APPROVED",
//       publishedAt: new Date("2026-04-11T11:20:00.000Z"),
//       viewCount: 284
//     },
//     {
//       slug: "national-theatre-new-writing-surge",
//       title: "National Theatre bets on a new-writing surge after stronger spring demand",
//       section: "Theatre",
//       excerpt: "Producers say younger audiences are returning for short-run premieres and contemporary work.",
//       dek: "The theatre topic page now opens with a seeded arts story built for a proper culture desk.",
//       authorEmail: "guestwriter2@londonnews.local",
//       content: buildGenericContent({
//         title: "National Theatre bets on a new-writing surge after stronger spring demand",
//         excerpt: "Producers say younger audiences are returning for short-run premieres and contemporary work.",
//         section: "Theatre"
//       }),
//       contentBlocks: buildGenericBlocks({
//         title: "National Theatre bets on a new-writing surge after stronger spring demand",
//         excerpt: "Producers say younger audiences are returning for short-run premieres and contemporary work.",
//         section: "Theatre"
//       }),
//       status: "APPROVED",
//       publishedAt: new Date("2026-04-10T18:30:00.000Z"),
//       viewCount: 233
//     },
//     {
//       slug: "small-venues-midnight-economy-music",
//       title: "London's small venues say the midnight economy still decides the music scene",
//       section: "Music",
//       excerpt: "Promoters argue that licensing and late transport remain as important as streaming economics.",
//       dek: "The music topic page launches with a London venues story rooted in the city's live scene.",
//       authorEmail: "guestwriter1@londonnews.local",
//       content: buildGenericContent({
//         title: "London's small venues say the midnight economy still decides the music scene",
//         excerpt: "Promoters argue that licensing and late transport remain as important as streaming economics.",
//         section: "Music"
//       }),
//       contentBlocks: buildGenericBlocks({
//         title: "London's small venues say the midnight economy still decides the music scene",
//         excerpt: "Promoters argue that licensing and late transport remain as important as streaming economics.",
//         section: "Music"
//       }),
//       status: "APPROVED",
//       publishedAt: new Date("2026-04-09T19:15:00.000Z"),
//       viewCount: 221
//     },
//     {
//       slug: "indie-cinemas-awards-season-programming",
//       title: "Independent cinemas rethink awards-season programming to pull younger audiences",
//       section: "Film",
//       excerpt: "Operators are mixing repertory nights, director talks, and cheaper memberships to rebuild habits.",
//       dek: "Film becomes a dedicated London News topic page with its own seeded cinema story.",
//       authorEmail: "editor1@londonnews.local",
//       content: buildGenericContent({
//         title: "Independent cinemas rethink awards-season programming to pull younger audiences",
//         excerpt: "Operators are mixing repertory nights, director talks, and cheaper memberships to rebuild habits.",
//         section: "Film"
//       }),
//       contentBlocks: buildGenericBlocks({
//         title: "Independent cinemas rethink awards-season programming to pull younger audiences",
//         excerpt: "Operators are mixing repertory nights, director talks, and cheaper memberships to rebuild habits.",
//         section: "Film"
//       }),
//       status: "APPROVED",
//       publishedAt: new Date("2026-04-08T14:00:00.000Z"),
//       viewCount: 214
//     },
//     {
//       slug: "design-studios-reuse-materials-fitouts",
//       title: "Design studios turn to salvage yards as reuse becomes a London fit-out marker",
//       section: "Design",
//       excerpt: "Architects and workplace designers say clients now expect visible sustainability in interior choices.",
//       dek: "The design topic page now has its own seeded story bridging culture, business, and city aesthetics.",
//       authorEmail: "journalist1@londonnews.local",
//       content: buildGenericContent({
//         title: "Design studios turn to salvage yards as reuse becomes a London fit-out marker",
//         excerpt: "Architects and workplace designers say clients now expect visible sustainability in interior choices.",
//         section: "Design"
//       }),
//       contentBlocks: buildGenericBlocks({
//         title: "Design studios turn to salvage yards as reuse becomes a London fit-out marker",
//         excerpt: "Architects and workplace designers say clients now expect visible sustainability in interior choices.",
//         section: "Design"
//       }),
//       status: "APPROVED",
//       publishedAt: new Date("2026-04-07T07:40:00.000Z"),
//       viewCount: 205
//     },
//     {
//       slug: "borough-housing-strategy-draft",
//       title: "Borough housing strategy enters draft stage ahead of consultation",
//       section: "Policy",
//       excerpt: "Draft article seeded for guest-writer workflow.",
//       dek: "A seeded draft demonstrating the guest-writer side of the article editor.",
//       authorEmail: "guestwriter1@londonnews.local",
//       content: buildGenericContent({
//         title: "Borough housing strategy enters draft stage ahead of consultation",
//         excerpt: "Draft article seeded for guest-writer workflow.",
//         section: "Policy"
//       }),
//       contentBlocks: buildGenericBlocks({
//         title: "Borough housing strategy enters draft stage ahead of consultation",
//         excerpt: "Draft article seeded for guest-writer workflow.",
//         section: "Policy"
//       }),
//       status: "DRAFT",
//       publishedAt: null,
//       viewCount: 0
//     },
//     {
//       slug: "city-hall-budget-notes-review",
//       title: "City Hall budget notes are waiting for editor review",
//       section: "City Hall",
//       excerpt: "Seeded review-queue entry for the editorial dashboard.",
//       dek: "A story currently in review so the workflow is visible on first run.",
//       authorEmail: "guestwriter2@londonnews.local",
//       content: buildGenericContent({
//         title: "City Hall budget notes are waiting for editor review",
//         excerpt: "Seeded review-queue entry for the editorial dashboard.",
//         section: "City Hall"
//       }),
//       contentBlocks: buildGenericBlocks({
//         title: "City Hall budget notes are waiting for editor review",
//         excerpt: "Seeded review-queue entry for the editorial dashboard.",
//         section: "City Hall"
//       }),
//       status: "IN_REVIEW",
//       publishedAt: null,
//       viewCount: 0
//     }
//   ];

//   const articleMap = new Map<string, string>();
//   for (const story of storyPool) {
//     const article = await upsertArticle(story, sectionMap, userMap);
//     articleMap.set(story.slug, article.id);
//   }

//   const classifiedsPool: SeedClassified[] = [
//     ...classifiedListings.map((listing, index) => ({
//       slug: listing.slug,
//       category: listing.category,
//       title: listing.title,
//       price: listing.price,
//       location: listing.location,
//       summary: listing.summary,
//       description: listing.description.join("\n\n"),
//       image: listing.image,
//       sellerName: listing.sellerName,
//       sellerEmail: listing.contactEmail,
//       sellerPhone: listing.sellerPhone,
//       featured: listing.featured,
//       status: "APPROVED" as const,
//       submittedAt: new Date(new Date(listing.postedAt).getTime() - 3_600_000),
//       publishedAt: new Date(listing.postedAt),
//       expiresAt: new Date(new Date(listing.postedAt).getTime() + 45 * 86_400_000),
//       submittedByEmail: index % 2 === 0 ? "editor1@londonnews.local" : "editor2@londonnews.local"
//     })),
//     {
//       slug: "notting-hill-barista-weekend-role",
//       category: "Jobs",
//       title: "Weekend barista role available in Notting Hill",
//       price: "GBP 15 per hour",
//       location: "Notting Hill",
//       summary: "Seeded review-queue listing so the classifieds moderation desk is populated on first run.",
//       description: [
//         "Independent cafe seeking a confident weekend barista with prior espresso-machine experience.",
//         "Early starts, friendly neighbourhood team, and immediate trial shifts available."
//       ].join("\n\n"),
//       sellerName: "Hollis Coffee",
//       sellerEmail: "classifieds+barista@londonnews.local",
//       sellerPhone: "+44 20 7946 0860",
//       status: "IN_REVIEW",
//       submittedAt: new Date("2026-04-21T06:45:00.000Z"),
//       publishedAt: null,
//       expiresAt: new Date("2026-05-21T00:00:00.000Z"),
//       reviewNotes: "Check pay-rate formatting and confirm whether weekend-only should be reflected in the headline.",
//       submittedByEmail: "guestwriter1@londonnews.local"
//     },
//     {
//       slug: "walthamstow-piano-lessons-community",
//       category: "Services",
//       title: "Community piano lessons in Walthamstow",
//       price: "From GBP 25 per session",
//       location: "Walthamstow",
//       summary: "Draft listing showing the editorial side of the classifieds creation flow.",
//       description: [
//         "Private and small-group piano lessons for beginners, returners, and children preparing for music exams.",
//         "Flexible weekday evening slots available, with introductory consultation by arrangement."
//       ].join("\n\n"),
//       sellerName: "Marta Evans",
//       sellerEmail: "classifieds+piano@londonnews.local",
//       sellerPhone: "+44 20 7946 0861",
//       status: "DRAFT",
//       submittedAt: null,
//       publishedAt: null,
//       expiresAt: new Date("2026-06-15T00:00:00.000Z"),
//       reviewNotes: "",
//       submittedByEmail: "editor1@londonnews.local"
//     },
//     {
//       slug: "southbank-event-photography-last-minute",
//       category: "Services",
//       title: "Last-minute South Bank event photographer",
//       price: "From GBP 300",
//       location: "South Bank",
//       summary: "Rejected example kept in the seed so status filtering is visible in the admin desk.",
//       description: [
//         "Same-week availability for conferences, launches, and private events across central London.",
//         "Rejected in seed because the first submission lacked enough seller verification detail."
//       ].join("\n\n"),
//       sellerName: "Luca Steele",
//       sellerEmail: "classifieds+southbankphoto@londonnews.local",
//       sellerPhone: "+44 20 7946 0862",
//       status: "REJECTED",
//       submittedAt: new Date("2026-04-18T09:00:00.000Z"),
//       publishedAt: null,
//       expiresAt: new Date("2026-05-18T00:00:00.000Z"),
//       reviewNotes: "Rejected in seed demo due to incomplete verification and vague pricing detail.",
//       submittedByEmail: "guestwriter2@londonnews.local"
//     }
//   ];

//   for (const listing of classifiedsPool) {
//     await upsertClassified(listing, userMap);
//   }

//   const homepage = await prisma.homepage.upsert({
//     where: { slug: "default" },
//     update: {
//       title: "Default Homepage",
//       isActive: true,
//       seoTitle: "London News",
//       seoDescription: "The London News front page.",
//       seoImage: homepageData.goodNewsStories[0]?.image || articlePageData.heroImage,
//       settings: stringifyJsonField(defaultHomepageSettings())
//     },
//     create: {
//       slug: "default",
//       title: "Default Homepage",
//       isActive: true,
//       seoTitle: "London News",
//       seoDescription: "The London News front page.",
//       seoImage: homepageData.goodNewsStories[0]?.image || articlePageData.heroImage,
//       settings: stringifyJsonField(defaultHomepageSettings())
//     }
//   });

//   await prisma.homepage.updateMany({
//     where: { id: { not: homepage.id } },
//     data: { isActive: false }
//   });

//   await prisma.homepageSection.deleteMany({
//     where: { homepageId: homepage.id }
//   });

//   const homepageSections: Array<{
//     key: string;
//     kind: string;
//     title: string;
//     slugs: string[];
//   }> = [
//     {
//       key: "leadStory",
//       kind: "LEAD_STORY",
//       title: homepageData.goodNewsTitle,
//       slugs: homepageData.goodNewsStories.map((story) => hrefToSlug(story.href))
//     },
//     {
//       key: "supportingStories",
//       kind: "SUPPORTING_STORIES",
//       title: "Supporting stories",
//       slugs: homepageData.supportingStories.map((story) => hrefToSlug(story.href))
//     },
//     {
//       key: "secondFeature",
//       kind: "FEATURE",
//       title: "Second feature",
//       slugs: [hrefToSlug(homepageData.secondFeature.href)]
//     },
//     {
//       key: "tertiaryStories",
//       kind: "TERTIARY_STORIES",
//       title: "Tertiary stories",
//       slugs: homepageData.tertiaryStories.map((story) => hrefToSlug(story.href))
//     },
//     {
//       key: "topHeadlines",
//       kind: "HEADLINE_STACK",
//       title: "Top headlines",
//       slugs: articlePageData.relatedStories.map((story) => hrefToSlug(story.href))
//     }
//   ];

//   for (const [index, section] of homepageSections.entries()) {
//     await prisma.homepageSection.create({
//       data: {
//         homepageId: homepage.id,
//         key: section.key,
//         kind: section.kind,
//         title: section.title,
//         position: index + 1,
//         settings: stringifyJsonField({}),
//         slots: {
//           create: section.slugs
//             .map((slug, slotIndex) => articleMap.get(slug))
//             .filter((id): id is string => Boolean(id))
//             .map((articleId, slotIndex) => ({
//               position: slotIndex + 1,
//               articleId,
//               settings: stringifyJsonField({})
//             }))
//         }
//       }
//     });
//   }

//   const homepageSettings = defaultHomepageSettings();
//   const surveyDay = getMoodSurveyDay();
//   const seededMoodVotesByKey: Record<string, number> = {
//     happy: 41,
//     sad: 3,
//     "cant-complain": 6
//   };

//   await prisma.moodSurveyVote.deleteMany({
//     where: {
//       homepageId: homepage.id,
//       surveyDay
//     }
//   });

//   await prisma.moodSurveyVote.createMany({
//     data: homepageSettings.moodOptions.flatMap((option) =>
//       Array.from({ length: seededMoodVotesByKey[option.key] || 0 }, (_, index) => ({
//         homepageId: homepage.id,
//         visitorId: `seed-${option.key}-${index + 1}`,
//         surveyDay,
//         optionKey: option.key,
//         optionLabel: option.label,
//         createdAt: new Date(Date.now() - (index + 1) * 60_000)
//       }))
//     )
//   });

//   const existingDraft = await prisma.homepageVersion.findFirst({
//     where: {
//       homepageId: homepage.id,
//       label: "Morning homepage draft"
//     }
//   });

//   const homepageDraftData = {
//     homepageId: homepage.id,
//     label: "Morning homepage draft",
//     status: "DRAFT",
//     previewToken: "demo-preview-token",
//     createdById: userMap.get("editor1@londonnews.local"),
//     snapshot: stringifyJsonField({
//       title: "Default Homepage",
//       slug: "default",
//       seoTitle: "London News",
//       seoDescription: "The London News front page.",
//       seoImage: homepageData.goodNewsStories[0]?.image || articlePageData.heroImage,
//       settings: defaultHomepageSettings(),
//       sections: homepageSections.map((section, index) => ({
//         key: section.key,
//         kind: section.kind,
//         title: section.title,
//         position: index + 1,
//         settings: {},
//         slots: section.slugs
//           .map((slug, slotIndex) => articleMap.get(slug))
//           .filter((id): id is string => Boolean(id))
//           .map((articleId, slotIndex) => ({
//             position: slotIndex + 1,
//             articleId
//           }))
//       }))
//     })
//   } as const;

//   if (existingDraft) {
//     await prisma.homepageVersion.update({
//       where: { id: existingDraft.id },
//       data: homepageDraftData
//     });
//   } else {
//     await prisma.homepageVersion.create({
//       data: homepageDraftData
//     });
//   }

//   console.log("London News seed complete.");
// }

// main()
//   .catch((error) => {
//     console.error(error);
//     process.exit(1);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });