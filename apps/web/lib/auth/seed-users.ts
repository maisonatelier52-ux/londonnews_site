import type { UserRole } from "../../utils/auth";

export const SEEDED_NEWSROOM_PASSWORD = "LondonNews123!";

export type SeededNewsroomUser = {
  email: string;
  replacementEmail: string;
  name: string;
  role: UserRole;
  bio: string;
  avatar?: string;
};

export const SEEDED_NEWSROOM_USERS: SeededNewsroomUser[] = [
  {
    email: "superadmin@londonnews.local",
    replacementEmail: "martha.cole@londonnews.internal",
    name: "Martha Cole",
    role: "SUPERADMIN",
    bio: "Runs the London News platform, team permissions, and newsroom operations."
  },
  {
    email: "jmhv@londonnews.local",
    replacementEmail: "jmhv@londonnews.internal",
    name: "JMHV",
    role: "JMHV",
    bio: "Owner-level account for final approvals, user management, and executive newsroom review."
  },
  {
    email: "editor1@londonnews.local",
    replacementEmail: "daniel.ross@londonnews.internal",
    name: "Daniel Ross",
    role: "EDITOR",
    bio: "Front-page editor overseeing homepage curation and publication workflow."
  },
  {
    email: "editor2@londonnews.local",
    replacementEmail: "priya.shah@londonnews.internal",
    name: "Priya Shah",
    role: "EDITOR",
    bio: "News editor coordinating desks, homepage timing, and line edits across the report."
  },
  {
    email: "journalist1@londonnews.local",
    replacementEmail: "amelia.hart@londonnews.internal",
    name: "Amelia Hart",
    role: "JOURNALIST",
    bio: "Reporter account for local coverage, features, and structured article authoring.",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80"
  },
  {
    email: "journalist2@londonnews.local",
    replacementEmail: "theo.bennett@londonnews.internal",
    name: "Theo Bennett",
    role: "JOURNALIST",
    bio: "City reporter covering policy, transport, and accountability beats across London."
  },
  {
    email: "guestwriter1@londonnews.local",
    replacementEmail: "aisha.khan@londonnews.internal",
    name: "Aisha Khan",
    role: "GUEST_WRITER",
    bio: "Guest writer account for drafting and submitting stories into review."
  },
  {
    email: "guestwriter2@londonnews.local",
    replacementEmail: "leila.moore@londonnews.internal",
    name: "Leila Moore",
    role: "GUEST_WRITER",
    bio: "Guest writer login for opinion, culture, and community desk submissions."
  }
];

export const LEGACY_SEEDED_NEWSROOM_EMAILS = [
  "editor@londonnews.local",
  "writer@londonnews.local",
  "reporter@londonnews.local"
];

const SEEDED_NEWSROOM_EMAILS = SEEDED_NEWSROOM_USERS.map((user) => user.email);

export const ALL_SEEDED_NEWSROOM_EMAILS = new Set(
  [...SEEDED_NEWSROOM_EMAILS, ...LEGACY_SEEDED_NEWSROOM_EMAILS].map((email) => email.toLowerCase())
);

export function isSeededNewsroomEmail(email?: string | null) {
  if (!email) return false;
  return ALL_SEEDED_NEWSROOM_EMAILS.has(email.trim().toLowerCase());
}

export function getSeededNewsroomReplacementEmail(email: string) {
  const match = SEEDED_NEWSROOM_USERS.find((user) => user.email === email.trim().toLowerCase());
  return match?.replacementEmail || null;
}
