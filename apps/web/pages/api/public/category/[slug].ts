import type { NextApiRequest, NextApiResponse } from "next";
import { getCategoryPageDataBySlug } from "../../../../lib/cms/queries/category-by-slug";
import { requireMethod, setPublicApiCache } from "../../../../lib/server/api";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requireMethod(req, res, ["GET"])) return;

  try {
    const slug = req.query.slug as string;
    const data = await getCategoryPageDataBySlug(slug);
    if (!data) return res.status(404).json({ error: "Category not found" });
    setPublicApiCache(res, { sMaxAge: 180, staleWhileRevalidate: 900 });
    return res.status(200).json(data);
  } catch {
    return res.status(503).json({ error: "Category data is temporarily unavailable." });
  }
}
