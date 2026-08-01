import type { NextApiRequest, NextApiResponse } from "next";
import { searchSite } from "../../../lib/search/query";
import { requireMethod, setPublicApiCache } from "../../../lib/server/api";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requireMethod(req, res, ["GET"])) return;

  const query = typeof req.query.q === "string" ? req.query.q.trim() : "";
  if (!query) {
    setPublicApiCache(res, { sMaxAge: 60, staleWhileRevalidate: 300 });
    return res.status(200).json({ query: "", results: [] });
  }

  try {
    const results = await searchSite(query);
    setPublicApiCache(res, { sMaxAge: 60, staleWhileRevalidate: 300 });
    return res.status(200).json({ query, results });
  } catch {
    return res.status(503).json({ error: "Search is temporarily unavailable." });
  }
}
