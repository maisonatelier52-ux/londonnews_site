export type NavItem = {
  label: string;
  href: string;
  children?: NavItem[];
};

export type TaxonomyLink = {
  name: string;
  slug: string;
  href: string;
  navLabel?: string;
  description?: string;
  articleCount?: number;
};

export type MoodItem = {
  key: string;
  label: string;
  value: string;
};

export type MoodOption = {
  key: string;
  label: string;
};

export type StoryCardData = {
  id: string;
  section: string;
  title: string;
  excerpt: string;
  href: string;
  image?: string | null;
  kicker?: string | null;
  readLabel?: string;
};

export type HeadlineItem = {
  id: string;
  title: string;
  summary: string;
  href: string;
};

export type EventItem = {
  title: string;
  time: string;
  category: string;
};

export type ClassifiedItem = {
  category: string;
  title: string;
  href: string;
};

export type ClassifiedCardView = {
  slug: string;
  category: string;
  title: string;
  price: string;
  location: string;
  summary: string;
  image?: string;
  postedAt: string;
  featured?: boolean;
};

export type ClassifiedDetailView = ClassifiedCardView & {
  description: string[];
  sellerName: string;
  sellerEmail: string;
  sellerPhone?: string;
  expiresAt?: string | null;
};

export type HomepageView = {
  betaLabel: string;
  mastheadLine: string;
  mastheadTop: string;
  mastheadBottom: string;
  nav: NavItem[];
  utilityLinks: NavItem[];
  forecastTabs: string[];
  moodOptions: MoodOption[];
  moodUpdatedText: string;
  moodHeadline: string;
  moodBreakdown: MoodItem[];
  surveyTitle: string;
  surveyButtonLabel: string;
  surveySuccessText: string;
  moodTotalVotes?: number;
  goodNewsTitle: string;
  goodNewsStories: StoryCardData[];
  leadStory: StoryCardData;
  supportingStories: StoryCardData[];
  secondFeature: StoryCardData;
  tertiaryStories: StoryCardData[];
  topHeadlines: HeadlineItem[];
  socialCalendarTitle: string;
  subscribeTitle: string;
  subscribeBody: string;
  eventsAreaLabel: string;
  events: EventItem[];
  classifieds: ClassifiedItem[];
  seo?: {
    title?: string;
    description?: string;
    image?: string | null;
  };
};

export type BodyBlock =
  | { type: "paragraph"; content: string }
  | { type: "subhead"; content: string }
  | { type: "quote"; content: string; attribution?: string }
  | { type: "list"; items: string[] }
  | { type: "image"; src: string; alt: string; caption?: string }
  | { type: "embed"; href: string; label?: string }
  | { type: "related"; title: string; href: string; summary?: string };

export type AuthorView = {
  id?: string;
  name: string;
  role: string;
  bio: string;
  avatar?: string;
};

export type ArticleCorrectionView = {
  id: string;
  note: string;
  createdAt: string;
  createdByName?: string;
};

export type ArticleView = {
  slug: string;
  section: string;
  sectionSlug?: string;
  sectionHref?: string;
  parentSection?: TaxonomyLink;
  title: string;
  dek: string;
  publishedAt: string;
  updatedAt: string;
  heroImage: string;
  heroAlt: string;
  body: BodyBlock[];
  author: AuthorView;
  correctionNotes: ArticleCorrectionView[];
  relatedStories: StoryCardData[];
  mostRead: StoryCardData[];
  events: EventItem[];
  seo?: {
    title?: string;
    description?: string;
    image?: string;
    canonical?: string;
    noindex?: boolean;
    socialTitle?: string;
    socialDescription?: string;
  };
};

export type CategoryView = {
  kind: "category" | "topic";
  slug: string;
  name: string;
  description: string;
  href: string;
  parent?: TaxonomyLink | null;
  childTopics: TaxonomyLink[];
  siblingTopics: TaxonomyLink[];
  leadStory: StoryCardData | null;
  featuredStories: StoryCardData[];
  latestStories: StoryCardData[];
  mostRead: StoryCardData[];
  articleCount: number;
  seo?: {
    title?: string;
    description?: string;
    image?: string | null;
  };
};

export type ClassifiedIndexView = {
  listings: ClassifiedCardView[];
  featuredListings: ClassifiedCardView[];
  categories: string[];
};