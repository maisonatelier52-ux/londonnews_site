import type { NavItem } from "../cms-types";
import { getSectionPath } from "../taxonomy";

export type RecommendedCategory = {
  name: string;
  slug: string;
  navLabel?: string;
  description: string;
  color?: string;
  icon?: string;
  isVisible?: boolean;
  showInTopNav?: boolean;
  position: number;
  premium?: boolean;
  parentSlug?: string | null;
  seoTitle?: string;
  seoDescription?: string;
};

export const recommendedCategories: RecommendedCategory[] = [
  {
    name: "News",
    slug: "news",
    navLabel: "News",
    description: "Breaking news, city updates, and major London developments.",
    color: "#111827",
    showInTopNav: false,
    position: 1,
    seoTitle: "London News | Breaking News",
    seoDescription: "Breaking London news, live updates, and the biggest stories shaping the city."
  },
  {
    name: "Politics",
    slug: "politics",
    navLabel: "Politics",
    description: "City Hall, Westminster, policy, and power affecting London.",
    color: "#7c2d12",
    showInTopNav: true,
    position: 2
  },
  {
    name: "Business",
    slug: "business",
    navLabel: "Business",
    description: "Markets, property, work, careers, tech, and London's economy.",
    color: "#14532d",
    showInTopNav: true,
    position: 3
  },
  {
    name: "Culture",
    slug: "culture",
    navLabel: "Culture",
    description: "Theatre, music, film, design, books, nightlife, and what London is talking about.",
    color: "#581c87",
    showInTopNav: true,
    position: 4
  },
  {
    name: "Life",
    slug: "life",
    navLabel: "Life",
    description: "Modern London life, identity, family, wellbeing, and city living.",
    color: "#9a3412",
    showInTopNav: false,
    position: 5
  },
  {
    name: "Environment",
    slug: "environment",
    navLabel: "Environment",
    description: "Climate, air quality, green space, weather, and sustainability.",
    color: "#166534",
    showInTopNav: false,
    position: 6
  },
  {
    name: "Science",
    slug: "science",
    navLabel: "Science",
    description: "Research, innovation, health science, and the future of discovery.",
    color: "#1d4ed8",
    showInTopNav: false,
    position: 7
  },
  {
    name: "Art",
    slug: "art",
    navLabel: "Art",
    description: "Visual arts, design, galleries, and the creative industries.",
    color: "#6d28d9",
    showInTopNav: false,
    position: 8
  },
  {
    name: "Transport",
    slug: "transport",
    navLabel: "Transport",
    description: "TfL, rail, roads, airports, commuting, and infrastructure.",
    color: "#0f766e",
    showInTopNav: false,
    position: 9
  },
  {
    name: "City Hall",
    slug: "city-hall",
    navLabel: "City Hall",
    description: "The mayoralty, Assembly, borough power, and decisions made closest to Londoners.",
    color: "#9a3412",
    showInTopNav: false,
    position: 10,
    parentSlug: "politics"
  },
  {
    name: "Westminster",
    slug: "westminster",
    navLabel: "Westminster",
    description: "Parliament, ministers, Whitehall, and national politics shaping London life.",
    color: "#7c2d12",
    showInTopNav: false,
    position: 11,
    parentSlug: "politics"
  },
  {
    name: "Elections",
    slug: "elections",
    navLabel: "Elections",
    description: "Campaigns, polling, voter movements, and the contests that redraw political power.",
    color: "#991b1b",
    showInTopNav: false,
    position: 12,
    parentSlug: "politics"
  },
  {
    name: "Property",
    slug: "property",
    navLabel: "Property",
    description: "Housing, renting, development, and London real estate.",
    color: "#334155",
    showInTopNav: false,
    position: 20,
    parentSlug: "business"
  },
  {
    name: "Crime & Courts",
    slug: "crime-courts",
    navLabel: "Crime",
    description: "Crime reporting, justice, policing, and court coverage.",
    color: "#991b1b",
    showInTopNav: false,
    position: 11,
    parentSlug: "news"
  },
  {
    name: "Health",
    slug: "health",
    navLabel: "Health",
    description: "NHS, hospitals, public health, and wellbeing across London.",
    color: "#be185d",
    showInTopNav: false,
    position: 40
  },
  {
    name: "Education",
    slug: "education",
    navLabel: "Education",
    description: "Schools, universities, policy, and young Londoners.",
    color: "#b45309",
    showInTopNav: false,
    position: 41
  },
  {
    name: "Food & Drink",
    slug: "food-drink",
    navLabel: "Food",
    description: "Restaurants, markets, chefs, openings, and city dining.",
    color: "#b91c1c",
    showInTopNav: false,
    position: 42
  },
  {
    name: "Sport",
    slug: "sport",
    navLabel: "Sport",
    description: "Football, cricket, tennis, athletics, and London sport culture.",
    color: "#0f172a",
    showInTopNav: false,
    position: 43
  },
  {
    name: "Opinion",
    slug: "opinion",
    navLabel: "Opinion",
    description: "Columns, analysis, editorials, and expert viewpoints.",
    color: "#3f3f46",
    showInTopNav: false,
    position: 44
  },
  {
    name: "Community",
    slug: "community",
    navLabel: "Community",
    description: "Hyperlocal stories, charities, neighbourhoods, and local voices.",
    color: "#0369a1",
    showInTopNav: false,
    position: 45
  },
  {
    name: "Events",
    slug: "events",
    navLabel: "Events",
    description: "What's on, city events, festivals, and local calendars.",
    color: "#4338ca",
    showInTopNav: false,
    position: 46
  },
  {
    name: "Classifieds",
    slug: "classifieds",
    navLabel: "Classifieds",
    description: "Cars, homes, jobs, tech, and community listings.",
    color: "#475569",
    showInTopNav: true,
    position: 47
  },
  {
    name: "Markets",
    slug: "markets",
    navLabel: "Markets",
    description: "Trading desks, commodities, and the City signals moving London's financial story.",
    color: "#1f2937",
    showInTopNav: false,
    position: 21,
    parentSlug: "business"
  },
  {
    name: "Security",
    slug: "security",
    navLabel: "Security",
    description: "National security, intelligence, and public-safety reporting relevant to London readers.",
    color: "#374151",
    showInTopNav: false,
    position: 50,
    parentSlug: "news"
  },
  {
    name: "Weather",
    slug: "weather",
    navLabel: "Weather",
    description: "Forecasts, severe conditions, and climate-linked weather disruption across the capital.",
    color: "#0f766e",
    showInTopNav: false,
    position: 60,
    parentSlug: "environment"
  },
  {
    name: "Explainers",
    slug: "explainers",
    navLabel: "Explainers",
    description: "Context-first reporting that breaks down complex London stories clearly.",
    color: "#475569",
    showInTopNav: false,
    position: 51,
    parentSlug: "news"
  },
  {
    name: "Work & Careers",
    slug: "work-careers",
    navLabel: "Work & Careers",
    description: "Jobs, hiring, pay, workplace culture, and the pressure reshaping professional life.",
    color: "#14532d",
    showInTopNav: false,
    position: 22,
    parentSlug: "business"
  },
  {
    name: "Tech",
    slug: "tech",
    navLabel: "Tech",
    description: "Startups, platforms, AI, and digital infrastructure shaping London's economy.",
    color: "#0f172a",
    showInTopNav: false,
    position: 23,
    parentSlug: "business"
  },
  {
    name: "Retail",
    slug: "retail",
    navLabel: "Retail",
    description: "High streets, consumer brands, and the retail operators changing city commerce.",
    color: "#92400e",
    showInTopNav: false,
    position: 24,
    parentSlug: "business"
  },
  {
    name: "Startups",
    slug: "startups",
    navLabel: "Startups",
    description: "Founders, funding, and early-stage companies building in London.",
    color: "#7c3aed",
    showInTopNav: false,
    position: 25,
    parentSlug: "business"
  },
  {
    name: "Policy",
    slug: "policy",
    navLabel: "Policy",
    description: "Regulation, consultations, and policy decisions with outsized impact on London life.",
    color: "#78350f",
    showInTopNav: false,
    position: 13,
    parentSlug: "politics"
  },
  {
    name: "Theatre",
    slug: "theatre",
    navLabel: "Theatre",
    description: "The West End, fringe stages, reviews, and the productions animating the city after dark.",
    color: "#6d28d9",
    showInTopNav: false,
    position: 30,
    parentSlug: "culture"
  },
  {
    name: "Music",
    slug: "music",
    navLabel: "Music",
    description: "Live venues, festivals, albums, and the scenes defining London's sound right now.",
    color: "#7e22ce",
    showInTopNav: false,
    position: 31,
    parentSlug: "culture"
  },
  {
    name: "Film",
    slug: "film",
    navLabel: "Film",
    description: "Cinema, streaming, festivals, and the directors, actors, and studios driving the conversation.",
    color: "#581c87",
    showInTopNav: false,
    position: 32,
    parentSlug: "culture"
  },
  {
    name: "Design",
    slug: "design",
    navLabel: "Design",
    description: "Architecture, interiors, product thinking, and the visual culture shaping the capital.",
    color: "#4c1d95",
    showInTopNav: false,
    position: 33,
    parentSlug: "culture"
  }
];

function getRecommendedChildNavItems(parentSlug: string): NavItem[] {
  return recommendedCategories
    .filter((category) => category.parentSlug === parentSlug)
    .sort((a, b) => a.position - b.position)
    .map((category) => ({
      label: category.navLabel || category.name,
      href: getSectionPath(category)
    }));
}

export const defaultTopNavItems: NavItem[] = [
  ...recommendedCategories
    .filter((category) => category.showInTopNav && !category.parentSlug)
    .sort((a, b) => a.position - b.position)
    .map((category) => ({
      label: category.navLabel || category.name,
      href: getSectionPath(category),
      children: getRecommendedChildNavItems(category.slug)
    })),
  {
    label: "More",
    href: "/sections"
  }
];
