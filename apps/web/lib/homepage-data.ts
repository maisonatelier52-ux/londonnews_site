import { homepageClassifiedItems } from "./classifieds-data";
import { defaultTopNavItems } from "./categories/recommended-categories";

export type NavItem = {
  label: string;
  href: string;
  children?: NavItem[];
};

export type MoodOption = {
  key: string;
  label: string;
};

export type Story = {
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

export type HomepageData = {
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
  moodBreakdown: { key: string; label: string; value: string }[];
  surveyTitle: string;
  surveyButtonLabel: string;
  surveySuccessText: string;
  moodTotalVotes?: number;
  goodNewsTitle: string;
  goodNewsStories: Story[];
  leadStory: Story;
  supportingStories: Story[];
  secondFeature: Story;
  tertiaryStories: Story[];
  topHeadlines: HeadlineItem[];
  socialCalendarTitle: string;
  subscribeTitle: string;
  subscribeBody: string;
  eventsAreaLabel: string;
  events: EventItem[];
  classifieds: ClassifiedItem[];
};

export const homepageData: HomepageData = {
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
  moodOptions: [
    { key: "happy", label: "Happy" },
    { key: "sad", label: "Sad" },
    { key: "cant-complain", label: "Can't complain" },
  ],
  moodUpdatedText: "Updated 32 minutes ago",
  moodHeadline: "London is okay right now",
  moodBreakdown: [
    { key: "happy", label: "Happy", value: "82%" },
    { key: "sad", label: "Sad", value: "6%" },
    { key: "cant-complain", label: "Can't complain", value: "12%" },
  ],
  surveyTitle: "Take part in our daily survey",
  surveyButtonLabel: "Take survey",
  surveySuccessText: "Thanks. Check back tomorrow for the next pulse.",
  moodTotalVotes: 50,
  goodNewsTitle: "First, the good news",
  goodNewsStories: [
    {
      id: "good-news-1",
      section: "Music",
      kicker: "Lead story",
      title: "Lewis Capaldi's BST Hyde Park show will stream live around the world tonight",
      excerpt:
        "Fans who missed tickets can still watch the London set for free online, turning a sold-out Hyde Park date into a shared citywide moment.",
      href: "/articles/lewis-capaldi-bst-hyde-park-livestream",
      image: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1400&q=80",
      readLabel: "Read more",
    },
    {
      id: "good-news-2",
      section: "Culture",
      title: "Bayeux Tapestry is heading to the British Museum in a rare London loan",
      excerpt:
        "A once-in-a-generation exhibition is on the way, giving London one of its strongest museum stories of the summer.",
      href: "/articles/bayeux-tapestry-british-museum-london-loan",
      image: "https://images.unsplash.com/photo-1518998053901-5348d3961a04?auto=format&fit=crop&w=1400&q=80",
      readLabel: "Read more",
    },
    {
      id: "good-news-3",
      section: "Design",
      title: "Barbican's new Veggery pavilion puts food-growing design in the spotlight",
      excerpt:
        "The greenhouse-style installation adds a playful, practical architecture story to London's summer cultural calendar.",
      href: "/articles/barbican-veggery-pavilion-london",
      image: "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=1400&q=80",
      readLabel: "Read more",
    },
    {
      id: "good-news-4",
      section: "Design",
      title: "A bonsai treehouse exhibition brings small-scale wonder to London this summer",
      excerpt:
        "Running through August, the show gives families and design fans a new warm-weather stop in the city.",
      href: "/articles/bonsai-treehouse-exhibition-london-summer",
      image: "https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=1400&q=80",
      readLabel: "Read more",
    },
    {
      id: "good-news-5",
      section: "Events",
      title: "Summer Splash free lido is returning to Royal Victoria Dock later this month",
      excerpt:
        "The dockside swim spot is coming back for another run, adding a free outdoor option to London's peak summer stretch.",
      href: "/articles/summer-splash-royal-victoria-dock-return",
      image: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1400&q=80",
      readLabel: "Read more",
    },
    {
      id: "good-news-6",
      section: "Environment",
      title: "Queen Elizabeth II Garden opens a new public green space in Regent's Park",
      excerpt:
        "The newly opened garden adds fresh habitat and a quieter public corner to one of central London's best-loved parks.",
      href: "/articles/queen-elizabeth-ii-garden-regents-park-opens",
      image: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1400&q=80",
      readLabel: "Read more",
    },
  ],
  leadStory: {
    id: "lead-1",
    section: "Music",
    kicker: "Lead story",
    title: "Lewis Capaldi's BST Hyde Park show will stream live around the world tonight",
    excerpt:
      "Fans who missed tickets can still watch the London set for free online, turning a sold-out Hyde Park date into a shared citywide moment.",
    href: "/articles/lewis-capaldi-bst-hyde-park-livestream",
    image: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1400&q=80",
    readLabel: "Read more",
  },
  supportingStories: [
    {
      id: "support-1",
      section: "Culture",
      title: "The interesting architecture trend this year: indoor trees",
      excerpt: "A visually rich lifestyle card with a short teaser and a single CTA.",
      href: "/articles/indoor-trees-architecture-trend",
      image: "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=900&q=80",
      readLabel: "Explore story",
    },
    {
      id: "support-2",
      section: "Security",
      title: "How MI5 caught a UK embassy spy selling secrets to Russia",
      excerpt: "Supporting editorial cards sit in a clean grid beneath the lead story.",
      href: "/articles/mi5-caught-embassy-spy",
      image: "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=900&q=80",
      readLabel: "Read analysis",
    },
    {
      id: "support-3",
      section: "Markets",
      title: "Wheat markets recover with Black Sea grain deal under pressure",
      excerpt: "Section labels, strong headline hierarchy, and image-first presentation matter here.",
      href: "/articles/wheat-markets-recover",
      image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=900&q=80",
      readLabel: "Full report",
    },
  ],
  secondFeature: {
    id: "feature-2",
    section: "Politics",
    kicker: "Editor's Pick",
    title: "Boris Johnson forced to resign. Bye Bye Boris.",
    excerpt:
      "This wide feature block mirrors the lower visual rhythm of the reference homepage while keeping the markup flexible enough for enterprise curation.",
    href: "/articles/boris-johnson-resigns",
    image: "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?auto=format&fit=crop&w=1200&q=80",
    readLabel: "Open briefing",
  },
  tertiaryStories: [
    {
      id: "tertiary-1",
      section: "Science",
      title: "UK space launch: does failure spell end of Britain’s ambitions?",
      excerpt: "Use this card row for lower-priority but still promoted stories.",
      href: "/articles/uk-space-launch-failure",
      image: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=900&q=80",
      readLabel: "Read feature",
    },
    {
      id: "tertiary-2",
      section: "Weather",
      title: "Cold air and travel disruption expected across the capital this weekend",
      excerpt: "Cards can be editorial, utility-led, or hyperlocal.",
      href: "/articles/weekend-cold-weather-london",
      image: "https://images.unsplash.com/photo-1483921020237-2ff51e8e4b22?auto=format&fit=crop&w=900&q=80",
      readLabel: "See forecast",
    },
  ],
  topHeadlines: [
    {
      id: "headline-1",
      title: "Top headline of the day, by importance — 01",
      summary: "Use this stack for editor-curated short-form homepage callouts ranked by urgency or significance.",
      href: "/articles/top-headline-01",
    },
    {
      id: "headline-2",
      title: "Top headline of the day — 02",
      summary: "A compact editorial stack helps preserve the newspaper feel while keeping the homepage readable.",
      href: "/articles/top-headline-02",
    },
    {
      id: "headline-3",
      title: "Top headline of the day — 03",
      summary: "These can later be driven by homepage slotting tools in the CMS.",
      href: "/articles/top-headline-03",
    },
    {
      id: "headline-4",
      title: "Top headline of the day — 04",
      summary: "Every item should have a clean CTA and be editable independently.",
      href: "/articles/top-headline-04",
    },
    {
      id: "headline-5",
      title: "Top headline of the day — 05",
      summary: "This module is ideal for urgent stories, explainers, or opinion highlights.",
      href: "/articles/top-headline-05",
    },
  ],
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