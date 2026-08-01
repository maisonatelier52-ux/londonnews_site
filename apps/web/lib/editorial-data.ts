export type BodyBlock =
  | { type: "paragraph"; content: string }
  | { type: "subhead"; content: string }
  | { type: "quote"; content: string; attribution?: string }
  | { type: "list"; items: string[] }
  | { type: "image"; src: string; alt: string; caption?: string };

export type StoryCardData = {
  id: string;
  section: string;
  title: string;
  excerpt: string;
  href: string;
  image?: string;
  kicker?: string;
  readLabel?: string;
};

export type Author = {
  name: string;
  role: string;
  bio: string;
  avatar?: string;
};

export type EventItem = {
  title: string;
  time: string;
  category: string;
};

export type ArticlePageData = {
  slug: string;
  section: string;
  title: string;
  dek: string;
  publishedAt: string;
  updatedAt: string;
  heroImage: string;
  heroAlt: string;
  body: BodyBlock[];
  author: Author;
  relatedStories: StoryCardData[];
  mostRead: StoryCardData[];
  events: EventItem[];
};

export type CategoryPageData = {
  slug: string;
  name: string;
  description: string;
  leadStory: StoryCardData;
  featuredStories: StoryCardData[];
  latestStories: StoryCardData[];
  mostRead: StoryCardData[];
};

export const articlePageData: ArticlePageData = {
  slug: "pound-falls-sharply-against-dollar",
  section: "Business",
  title: "Pound falls sharply against dollar after Bank confirms bond-buying end date",
  dek: "Sterling slid after renewed market concern, as analysts weighed the impact of tighter central bank action, investor nerves, and pressure on borrowing costs.",
  publishedAt: "2026-04-16T08:30:00.000Z",
  updatedAt: "2026-04-16T10:15:00.000Z",
  heroImage: "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1400&q=80",
  heroAlt: "London financial district skyline",
  author: {
    name: "Amelia Hart",
    role: "Economics Correspondent",
    bio: "Amelia covers inflation, rates, markets, and the politics of economic policy across the UK and Europe.",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80",
  },
  body: [
    {
      type: "paragraph",
      content:
        "Sterling weakened sharply in afternoon trading as markets absorbed the latest central bank signal on support measures. Traders said confidence remained fragile, particularly after a string of comments that reinforced concern about how quickly liquidity conditions could tighten.",
    },
    {
      type: "paragraph",
      content:
        "Investors were already pricing in a difficult path for risk assets, but the change in tone pushed expectations further. Bond yields moved, the pound slipped, and analysts said volatility could remain elevated in the short term as institutions repositioned before the next major policy test.",
    },
    {
      type: "subhead",
      content: "Markets still looking for clarity",
    },
    {
      type: "paragraph",
      content:
        "Several strategists argued that the move was less about a single statement and more about the broader question of whether policymakers can reassure markets while still appearing disciplined on inflation. That tension has defined the week’s reaction across currencies, government debt, and bank stocks.",
    },
    {
      type: "quote",
      content:
        "What the market wants now is not just firmness, but predictability. If that is missing, every shift in tone can look larger than it really is.",
      attribution: "Senior rates strategist, City of London",
    },
    {
      type: "paragraph",
      content:
        "For households and businesses, the immediate story remains borrowing costs and confidence. Lenders are rechecking assumptions, and companies exposed to imported costs are watching currency moves closely. Economists said the next phase will depend on whether volatility settles quickly or spills further into everyday financing conditions.",
    },
    {
      type: "image",
      src: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=1200&q=80",
      alt: "City street in London",
      caption: "Analysts expect market sensitivity to remain high in the coming sessions.",
    },
    {
      type: "subhead",
      content: "What readers should watch next",
    },
    {
      type: "list",
      items: [
        "Whether government borrowing costs continue to rise",
        "How mortgage lenders respond over the next 24 to 72 hours",
        "Any additional signal from the central bank on market stability",
        "Whether sterling recovers or extends losses into the next session",
      ],
    },
    {
      type: "paragraph",
      content:
        "Editors can later use this article layout for explainers, live updates, long reads, or premium features. The structure is intentionally modular so the CMS can feed richer block types over time.",
    },
  ],
  relatedStories: [
    {
      id: "rel-1",
      section: "Markets",
      title: "Wheat markets recover with Black Sea grain deal under pressure",
      excerpt: "Commodity traders are watching supply signals as geopolitical concerns return.",
      href: "/articles/wheat-markets-recover",
      image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=900&q=80",
      readLabel: "Read report",
    },
    {
      id: "rel-2",
      section: "Politics",
      title: "Treasury faces pressure to explain latest debt response strategy",
      excerpt: "Ministers are seeking to reassure markets and voters at the same time.",
      href: "/articles/treasury-debt-response",
      image: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=900&q=80",
      readLabel: "Open briefing",
    },
    {
      id: "rel-3",
      section: "Explainers",
      title: "What gilt yields actually mean for households and pension funds",
      excerpt: "A concise explainer module fits well under heavily read finance stories.",
      href: "/articles/what-gilt-yields-mean",
      image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=900&q=80",
      readLabel: "Read explainer",
    },
  ],
  mostRead: [
    {
      id: "mr-1",
      section: "Politics",
      title: "Cabinet faces renewed scrutiny after policy U-turn",
      excerpt: "Short format most-read item.",
      href: "/articles/cabinet-renewed-scrutiny",
    },
    {
      id: "mr-2",
      section: "Weather",
      title: "Cold air and disruption expected this weekend",
      excerpt: "Short format most-read item.",
      href: "/articles/weekend-cold-weather-london",
    },
    {
      id: "mr-3",
      section: "Culture",
      title: "Inside London’s new indoor green design movement",
      excerpt: "Short format most-read item.",
      href: "/articles/indoor-trees-architecture-trend",
    },
  ],
  events: [
    { category: "Briefing", time: "08:30", title: "Morning markets update" },
    { category: "Panel", time: "13:00", title: "Housing and rates discussion" },
    { category: "Community", time: "18:00", title: "Local business networking event" },
  ],
};

export const categoryPageData: CategoryPageData = {
  slug: "business",
  name: "Business",
  description:
    "Markets, policy, tech, property, and the forces shaping London’s commercial life.",
  leadStory: {
    id: "cat-lead-1",
    section: "Business",
    kicker: "Lead Story",
    title: "Pound falls sharply against dollar after Bank confirms bond-buying end date",
    excerpt:
      "The lead category story should feel large, urgent, and image-led, just like the homepage feature.",
    href: "/articles/pound-falls-sharply-against-dollar",
    image: "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1400&q=80",
    readLabel: "Read more",
  },
  featuredStories: [
    {
      id: "cat-feat-1",
      section: "Property",
      title: "Commercial landlords reassess office demand across central London",
      excerpt: "A secondary feature card beneath the category lead story.",
      href: "/articles/commercial-landlords-office-demand",
      image: "https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&w=900&q=80",
      readLabel: "Read story",
    },
    {
      id: "cat-feat-2",
      section: "Retail",
      title: "High street operators plan summer push after mixed first quarter",
      excerpt: "The category page uses the same story-card language as the homepage.",
      href: "/articles/high-street-operators-summer-push",
      image: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80",
      readLabel: "Open report",
    },
  ],
  latestStories: [
    {
      id: "cat-latest-1",
      section: "Tech",
      title: "Fintech firms face new pressure on compliance and hiring",
      excerpt: "Latest stories can be smaller but still highly visual.",
      href: "/articles/fintech-compliance-hiring",
      image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80",
    },
    {
      id: "cat-latest-2",
      section: "Markets",
      title: "FTSE edges higher as commodity gains support mining stocks",
      excerpt: "A compact story card suitable for desktop and mobile grids.",
      href: "/articles/ftse-edges-higher",
      image: "https://images.unsplash.com/photo-1642790106117-e829e14a795f?auto=format&fit=crop&w=900&q=80",
    },
    {
      id: "cat-latest-3",
      section: "Startups",
      title: "Three London founders on building through a funding slowdown",
      excerpt: "Category pages should balance urgency with magazine polish.",
      href: "/articles/london-founders-funding-slowdown",
      image: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=900&q=80",
    },
    {
      id: "cat-latest-4",
      section: "Policy",
      title: "City leaders seek more detail on long-term competitiveness plan",
      excerpt: "Use this row for the latest mix of breaking, analysis, and features.",
      href: "/articles/city-competitiveness-plan",
      image: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=80",
    },
  ],
  mostRead: [
    {
      id: "cat-most-1",
      section: "Most Read",
      title: "Mortgage lenders review rates after a volatile week",
      excerpt: "",
      href: "/articles/mortgage-lenders-review-rates",
    },
    {
      id: "cat-most-2",
      section: "Most Read",
      title: "What a weaker pound means for imported household costs",
      excerpt: "",
      href: "/articles/weaker-pound-household-costs",
    },
    {
      id: "cat-most-3",
      section: "Most Read",
      title: "Could London offices bounce back faster than expected?",
      excerpt: "",
      href: "/articles/london-offices-bounce-back",
    },
  ],
};
