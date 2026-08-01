import type { NextApiRequest, NextApiResponse } from "next";
import { getArticlePageDataBySlug } from "../../../../lib/cms/queries/article-by-slug";
import { requireMethod, setPublicApiCache } from "../../../../lib/server/api";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requireMethod(req, res, ["GET"])) return;

  try {
    const slug = req.query.slug as string;
    const data = await getArticlePageDataBySlug(slug);
    if (!data) return res.status(404).json({ error: "Article not found" });
    setPublicApiCache(res, { sMaxAge: 120, staleWhileRevalidate: 900 });
    return res.status(200).json(data);
  } catch {
    return res.status(503).json({ error: "Article data is temporarily unavailable." });
  }
}
