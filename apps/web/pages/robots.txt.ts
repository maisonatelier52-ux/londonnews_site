import type { GetServerSideProps } from "next";
import { absoluteUrl } from "../lib/cms/utils";

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const body = [
    "User-agent: *",
    "Allow: /",
    "Disallow: /admin/",
    "Disallow: /api/",
    "Disallow: /preview/",
    "Disallow: /login",
    "Disallow: /register",
    "",
    `Sitemap: ${absoluteUrl("/sitemap.xml")}`,
    `Sitemap: ${absoluteUrl("/news-sitemap.xml")}`
  ].join("\n");

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");
  res.write(body);
  res.end();

  return {
    props: {}
  };
};

export default function RobotsTxt() {
  return null;
}
