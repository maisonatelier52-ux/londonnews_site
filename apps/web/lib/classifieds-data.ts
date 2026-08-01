export type ClassifiedListing = {
  slug: string;
  category: string;
  title: string;
  price: string;
  location: string;
  summary: string;
  description: string[];
  sellerName: string;
  contactEmail: string;
  sellerPhone?: string;
  image: string;
  postedAt: string;
  featured?: boolean;
};

export const CLASSIFIED_CATEGORY_OPTIONS = [
  "Cars",
  "Homes",
  "Phones",
  "Laptops",
  "Business",
  "Services",
  "Jobs",
  "Community"
] as const;

export const classifiedListings: ClassifiedListing[] = [
  {
    slug: "golf-for-sale",
    category: "Cars",
    title: "2020 Volkswagen Golf for sale",
    price: "GBP 14,950",
    location: "Hammersmith",
    summary: "Low-mileage automatic hatchback listed this week by a West London owner.",
    description: [
      "One-owner 2020 Volkswagen Golf with full service history, recent MOT, and clean interior. The seller is offering a quick local viewing for serious buyers.",
      "Good fit for the new London ULEZ reality, with practical running costs and enough space for family or commuter use."
    ],
    sellerName: "Oliver Reed",
    contactEmail: "classifieds+golf@londonnews.local",
    sellerPhone: "+44 20 7946 0851",
    image: "https://images.unsplash.com/photo-1553440569-bcc63803a83d?auto=format&fit=crop&w=1200&q=80",
    postedAt: "2026-04-21T08:30:00.000Z",
    featured: true
  },
  {
    slug: "flat-shepherds-bush",
    category: "Homes",
    title: "One-bedroom flat in Shepherd's Bush",
    price: "GBP 1,825 pcm",
    location: "Shepherd's Bush",
    summary: "Freshly listed rental with quick Tube access and a bright open-plan living room.",
    description: [
      "A compact but well-finished one-bedroom flat close to local transport, with separate bedroom storage and updated kitchen fittings.",
      "Suitable for a single professional or couple looking for a move-in-ready West London rental."
    ],
    sellerName: "Harper & Finch Lettings",
    contactEmail: "classifieds+shepherdsbush@londonnews.local",
    sellerPhone: "+44 20 7946 0852",
    image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80",
    postedAt: "2026-04-20T17:10:00.000Z",
    featured: true
  },
  {
    slug: "iphone-14",
    category: "Phones",
    title: "Unlocked iPhone 14 listed today",
    price: "GBP 495",
    location: "Canary Wharf",
    summary: "Unlocked handset with original box and strong battery health, available for same-day pickup.",
    description: [
      "Blue iPhone 14 in excellent condition, sold with original cable and protective case. The seller notes only minor edge wear from everyday use.",
      "Pickup is preferred, though insured UK shipping can be discussed."
    ],
    sellerName: "Nadia Karim",
    contactEmail: "classifieds+iphone14@londonnews.local",
    sellerPhone: "+44 20 7946 0853",
    image: "https://images.unsplash.com/photo-1678911820864-e2c567c655d7?auto=format&fit=crop&w=1200&q=80",
    postedAt: "2026-04-21T11:45:00.000Z"
  },
  {
    slug: "macbook-pro-14",
    category: "Laptops",
    title: "MacBook Pro 14-inch — excellent condition",
    price: "GBP 1,420",
    location: "Clerkenwell",
    summary: "Creator-owned laptop listed with charger, box, and light use history.",
    description: [
      "14-inch MacBook Pro with healthy battery cycle count, original charger, and no screen damage. Strong option for editing, design, or office work.",
      "Seller is open to meeting centrally for inspection before purchase."
    ],
    sellerName: "Samuel Price",
    contactEmail: "classifieds+macbook@londonnews.local",
    sellerPhone: "+44 20 7946 0854",
    image: "https://images.unsplash.com/photo-1517336714739-489689fd1ca8?auto=format&fit=crop&w=1200&q=80",
    postedAt: "2026-04-19T14:05:00.000Z"
  },
  {
    slug: "camden-market-stall-share",
    category: "Business",
    title: "Weekend Camden market stall share available",
    price: "GBP 180 per weekend",
    location: "Camden",
    summary: "Small-business listing for a shared retail pitch with strong footfall on Saturdays and Sundays.",
    description: [
      "An existing trader is offering a partial-share arrangement for a Camden market stall suited to crafts, accessories, or premium packaged goods.",
      "Flexible terms are available for trial weekends before committing to a longer run."
    ],
    sellerName: "Mina Clarke",
    contactEmail: "classifieds+camdenstall@londonnews.local",
    sellerPhone: "+44 20 7946 0855",
    image: "https://images.unsplash.com/photo-1519567241046-7f570eee3ce6?auto=format&fit=crop&w=1200&q=80",
    postedAt: "2026-04-18T09:20:00.000Z"
  },
  {
    slug: "community-noticeboard-wedding-photographer",
    category: "Services",
    title: "Independent wedding photographer booking summer dates",
    price: "From GBP 750",
    location: "Across London",
    summary: "Community services listing for a documentary-style photographer with a few weekend dates left.",
    description: [
      "London-based photographer specialising in relaxed ceremonies, small receptions, and registry office coverage. Portfolio and references available on request.",
      "This listing is aimed at readers planning intimate city weddings over the coming months."
    ],
    sellerName: "Elsie Morgan",
    contactEmail: "classifieds+photography@londonnews.local",
    sellerPhone: "+44 20 7946 0856",
    image: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=80",
    postedAt: "2026-04-17T12:00:00.000Z"
  }
];

export const homepageClassifiedItems = classifiedListings.slice(0, 4).map((listing) => ({
  category: listing.category,
  title: listing.title,
  href: `/classifieds/${listing.slug}`
}));

export function getClassifiedListingBySlug(slug: string) {
  return classifiedListings.find((listing) => listing.slug === slug) || null;
}

export function getRelatedClassifiedListings(slug: string, category: string) {
  return classifiedListings
    .filter((listing) => listing.slug !== slug && listing.category === category)
    .slice(0, 3);
}
