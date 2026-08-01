export type PublicPageSection = {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
};

export type PublicPageContent = {
  slug: string;
  eyebrow: string;
  title: string;
  description: string;
  updatedLabel: string;
  keywords: string[];
  sections: PublicPageSection[];
};

export const publicPages: PublicPageContent[] = [
  {
    slug: "about",
    eyebrow: "Newsroom",
    title: "About London News",
    description:
      "London News is a digital-first newspaper build for fast coverage, flexible homepage curation, and legacy-paper section depth across the capital.",
    updatedLabel: "Updated July 2026",
    keywords: ["about london news", "london newsroom", "london newspaper"],
    sections: [
      {
        heading: "Editorial focus",
        paragraphs: [
          "London News covers politics, city institutions, business, markets, property, work and careers, culture, technology, and classified listings in one unified publishing system.",
          "The product is designed to support daily news publishing, topic-page growth, editorial workflow, and direct operation from one newsroom platform without relying on a separate homepage builder."
        ]
      },
      {
        heading: "How the newsroom works",
        paragraphs: [
          "Editors control homepage slots, category hierarchy, topic pages, article metadata, and publish timing from the admin desk.",
          "Journalists and guest writers can work within role-based access, while super admins retain platform and user controls."
        ],
        bullets: [
          "Daily homepage curation",
          "Structured desk and topic taxonomy",
          "SEO-aware article publishing",
          "Classifieds workflow with moderation"
        ]
      }
    ]
  },
  {
    slug: "contact",
    eyebrow: "Newsroom",
    title: "Contact London News",
    description:
      "Contact London News for editorial feedback, corrections, commercial enquiries, memberships, and classifieds support.",
    updatedLabel: "Updated July 2026",
    keywords: ["contact london news", "london news contact", "editorial contact"],
    sections: [
      {
        heading: "Editorial enquiries",
        paragraphs: [
          "Use this page for reader feedback, corrections, tip-offs, rights questions, advertising enquiries, and partnership requests.",
          "Publisher inboxes and contact details can be managed centrally through deployment configuration while the public route remains stable."
        ],
        bullets: [
          "General editorial enquiries",
          "Corrections and clarifications",
          "Commercial and sponsorship requests",
          "Classifieds support and moderation questions"
        ]
      },
      {
        heading: "Response policy",
        paragraphs: [
          "Reader messages are captured in the newsroom system so editorial, memberships, and classifieds teams can review and route them appropriately."
        ]
      }
    ]
  },
  {
    slug: "editorial-policy",
    eyebrow: "Standards",
    title: "Editorial Policy",
    description:
      "London News aims for accurate, timely, clearly attributed reporting with visible separation between reporting, analysis, opinion, and commercial material.",
    updatedLabel: "Updated July 2026",
    keywords: ["editorial policy", "journalism standards", "london news policy"],
    sections: [
      {
        heading: "Core principles",
        paragraphs: [
          "We expect reporting to be fact-checked, sourced, and edited with clear accountability before publication.",
          "When stories contain analysis, commentary, or sponsored content, that treatment should be labelled so readers can distinguish it from straight reporting."
        ],
        bullets: [
          "Accuracy before speed",
          "Transparent attribution",
          "Clear labelling of opinion and sponsored material",
          "Prompt correction when errors are confirmed"
        ]
      },
      {
        heading: "Editorial independence",
        paragraphs: [
          "Commercial relationships, sponsorship, and advertising placements should not dictate newsroom conclusions or suppress legitimate reporting."
        ]
      }
    ]
  },
  {
    slug: "corrections-policy",
    eyebrow: "Standards",
    title: "Corrections Policy",
    description:
      "When London News confirms a significant factual error, it should correct the article promptly and record the change in a way readers can understand.",
    updatedLabel: "Updated July 2026",
    keywords: ["corrections policy", "news corrections", "london news standards"],
    sections: [
      {
        heading: "Correction workflow",
        paragraphs: [
          "Reported errors should be reviewed by an editor, checked against source material, and corrected on the published page as soon as the facts are verified.",
          "Material changes should include an editor's note, correction line, or update note where context would otherwise be lost."
        ],
        bullets: [
          "Review the claim",
          "Verify the source record",
          "Correct the article",
          "Add a transparent note when the change is material"
        ]
      }
    ]
  },
  {
    slug: "source-methodology",
    eyebrow: "Standards",
    title: "Source Methodology",
    description:
      "London News expects reporters to distinguish verified facts, sourced claims, direct observation, and analysis throughout the reporting process.",
    updatedLabel: "Updated July 2026",
    keywords: ["source methodology", "reporting process", "verification standards"],
    sections: [
      {
        heading: "Verification",
        paragraphs: [
          "Primary-source documents, named sources, public records, direct reporting, and on-the-record interviews should be preferred wherever available.",
          "Anonymous sourcing should be limited to cases where the information is important, the source is credible, and there is a justified editorial reason not to identify them publicly."
        ],
        bullets: [
          "Prefer primary documentation",
          "Use anonymous sources only when editorially justified",
          "Cross-check claims before publication",
          "Preserve context when quoting statistics or reports"
        ]
      }
    ]
  },
  {
    slug: "ownership-and-funding",
    eyebrow: "Standards",
    title: "Ownership and Funding",
    description:
      "Ownership, financial backing, sponsorship relationships, and other material influences should be disclosed clearly so readers can evaluate the publication's independence.",
    updatedLabel: "Updated July 2026",
    keywords: ["ownership and funding", "media transparency", "publisher disclosure"],
    sections: [
      {
        heading: "Transparency",
        paragraphs: [
          "The final production launch should disclose the ownership structure, the operating company, and any relevant funding model that supports newsroom operations.",
          "If external sponsors or partners support specific series, newsletters, or events, that support should be identified without obscuring editorial control."
        ]
      }
    ]
  },
  {
    slug: "advertising-policy",
    eyebrow: "Commercial",
    title: "Advertising Policy",
    description:
      "Advertising, sponsorship, and paid promotions should be clearly labelled and separated from newsroom copy and editorial decision-making.",
    updatedLabel: "Updated July 2026",
    keywords: ["advertising policy", "sponsored content", "commercial policy"],
    sections: [
      {
        heading: "Commercial separation",
        paragraphs: [
          "Advertorial, affiliate, sponsorship, and display advertising placements must be distinguishable from standard newsroom articles in both layout and labelling.",
          "The publishing team should maintain a review process for ad placements that could conflict with reader trust, safety, or newsroom standards."
        ]
      }
    ]
  },
  {
    slug: "right-of-reply",
    eyebrow: "Standards",
    title: "Right of Reply",
    description:
      "When serious claims are made about an individual or organisation, London News should provide a fair opportunity to respond before publication where practical.",
    updatedLabel: "Updated July 2026",
    keywords: ["right of reply", "fair comment", "news standards"],
    sections: [
      {
        heading: "Pre-publication fairness",
        paragraphs: [
          "The newsroom should make reasonable efforts to contact the subject of significant criticism or factual allegation before publication.",
          "If no response is received in time, the article should reflect that an opportunity to comment was offered."
        ]
      }
    ]
  },
  {
    slug: "terms-and-conditions",
    eyebrow: "Legal",
    title: "Terms and Conditions",
    description:
      "These terms outline the baseline expectations for accessing London News content, using site features, and interacting with reader submissions and classifieds.",
    updatedLabel: "Updated July 2026",
    keywords: ["terms and conditions", "site terms", "london news legal"],
    sections: [
      {
        heading: "Use of the service",
        paragraphs: [
          "Readers must not misuse the site, interfere with platform security, scrape protected areas, submit unlawful material, or impersonate other users.",
          "Subscriptions, registrations, and other service features may be limited, suspended, or changed by the publisher in line with applicable law and product policy."
        ]
      },
      {
        heading: "User submissions",
        paragraphs: [
          "When readers submit classifieds, comments, or other material, they should only provide content they have the right to publish and that complies with moderation rules."
        ]
      }
    ]
  },
  {
    slug: "legal",
    eyebrow: "Legal",
    title: "Legal Information",
    description:
      "London News publishes operator identity, registered address, and other jurisdiction-specific disclosures required for public operation.",
    updatedLabel: "Updated July 2026",
    keywords: ["legal information", "publisher legal", "site operator"],
    sections: [
      {
        heading: "Public disclosure",
        paragraphs: [
          "This route provides the stable public URL for legal disclosures and should be reviewed alongside the publisher's official company and compliance information."
        ]
      }
    ]
  },
  {
    slug: "privacy-policy",
    eyebrow: "Legal",
    title: "Privacy Policy",
    description:
      "London News should explain what reader data is collected, how it is used, and which third-party systems process that data for publishing, analytics, subscriptions, and support.",
    updatedLabel: "Updated July 2026",
    keywords: ["privacy policy", "reader data", "cookie and data policy"],
    sections: [
      {
        heading: "Data use",
        paragraphs: [
          "Personal data may be collected when readers subscribe, register, submit classifieds, vote in surveys, or contact the publication.",
          "Any production launch should describe the lawful basis for processing, retention expectations, reader rights, and the third-party services involved in analytics, hosting, authentication, CRM, or payments."
        ],
        bullets: [
          "Subscription and account data",
          "Analytics and basic device information",
          "Classifieds and form submission records",
          "Operational security and rate limiting data"
        ]
      }
    ]
  }
];

export function getPublicPage(slug: string) {
  return publicPages.find((page) => page.slug === slug) || null;
}
