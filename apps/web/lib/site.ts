export const SITE_NAME = "London News";
export const SITE_DESCRIPTION =
  "London News delivers reporting, analysis, and features across the capital with a modern newsroom workflow.";
export const SITE_LANGUAGE = "en-GB";
export const SITE_LOCALE = "en_GB";
export const SITE_TWITTER_HANDLE = "@LondonNews";

export function getSiteOrigin() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
}

